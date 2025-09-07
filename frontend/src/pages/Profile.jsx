import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  User, 
  Calendar, 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit3, 
  Mail,
  MapPin,
  Link as LinkIcon
} from 'lucide-react'
import { usersAPI, postsAPI } from '../utils/api'
import { formatDate, generateAvatarUrl, cn } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Profile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('posts')

  const isOwnProfile = !userId || userId === currentUser?.id

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['user', userId || currentUser?.id],
    queryFn: () => usersAPI.getUser(userId || currentUser?.id),
    enabled: !!currentUser
  })

  const {
    data: postsData,
    isLoading: postsLoading
  } = useQuery({
    queryKey: ['userPosts', userId || currentUser?.id],
    queryFn: () => postsAPI.getUserPosts(userId || currentUser?.id, 1, 20),
    enabled: !!currentUser
  })

  const followMutation = useMutation({
    mutationFn: usersAPI.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId || currentUser?.id])
      toast.success(isFollowing ? 'Unfollowed successfully' : 'Followed successfully')
    },
    onError: () => {
      toast.error('Failed to follow/unfollow user')
    },
  })

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load profile. Please try again.</p>
      </div>
    )
  }

  const profile = profileData?.data?.user
  const posts = postsData?.data?.posts || []
  const isFollowing = currentUser?.following?.some(follow => follow._id === profile?._id)

  const handleFollow = () => {
    if (!isOwnProfile) {
      followMutation.mutate(profile._id)
    }
  }

  const tabs = [
    { id: 'posts', label: 'Posts', count: profile?.postsCount || 0 },
    { id: 'followers', label: 'Followers', count: profile?.followers?.length || 0 },
    { id: 'following', label: 'Following', count: profile?.following?.length || 0 },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                className="h-24 w-24 rounded-full"
                src={profile?.profilePicture || generateAvatarUrl(profile?.username)}
                alt={profile?.username}
              />
              {profile?.isOnline && (
                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile?.username}</h1>
                  <p className="text-muted-foreground">{profile?.bio || 'No bio yet'}</p>
                </div>
                
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followMutation.isLoading}
                    className={cn(
                      "btn btn-sm mt-4 md:mt-0",
                      isFollowing ? "btn-outline" : "btn-primary"
                    )}
                  >
                    {followMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-6 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profile?.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{profile?.followers?.length || 0} followers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{profile?.following?.length || 0} following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'posts' && (
          <PostsTab posts={posts} isLoading={postsLoading} />
        )}
        
        {activeTab === 'followers' && (
          <FollowersTab userId={profile?._id} />
        )}
        
        {activeTab === 'following' && (
          <FollowingTab userId={profile?._id} />
        )}
      </div>
    </div>
  )
}

const PostsTab = ({ posts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <div key={post._id} className="card">
          <div className="card-content">
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Post image"
                className="mt-4 rounded-lg w-full max-h-64 object-cover"
              />
            )}
          </div>
          <div className="card-footer">
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
              <span>{formatDate(post.createdAt)}</span>
              <div className="flex items-center space-x-4">
                <span>{post.likes.length} likes</span>
                <span>{post.comments.length} comments</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const FollowersTab = ({ userId }) => {
  const { data: followersData, isLoading } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => usersAPI.getFollowers(userId, 1, 50),
    enabled: !!userId
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const followers = followersData?.data?.followers || []

  if (followers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No followers yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {followers.map((follower) => (
        <div key={follower._id} className="flex items-center space-x-4 p-4 border rounded-lg">
          <img
            className="h-12 w-12 rounded-full"
            src={follower.profilePicture || generateAvatarUrl(follower.username)}
            alt={follower.username}
          />
          <div className="flex-1">
            <h3 className="font-medium">{follower.username}</h3>
            <p className="text-sm text-muted-foreground">
              {follower.isOnline ? 'Online' : `Last seen ${formatDate(follower.lastSeen)}`}
            </p>
          </div>
          <button className="btn btn-outline btn-sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </button>
        </div>
      ))}
    </div>
  )
}

const FollowingTab = ({ userId }) => {
  const { data: followingData, isLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => usersAPI.getFollowing(userId, 1, 50),
    enabled: !!userId
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const following = followingData?.data?.following || []

  if (following.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Not following anyone yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {following.map((user) => (
        <div key={user._id} className="flex items-center space-x-4 p-4 border rounded-lg">
          <img
            className="h-12 w-12 rounded-full"
            src={user.profilePicture || generateAvatarUrl(user.username)}
            alt={user.username}
          />
          <div className="flex-1">
            <h3 className="font-medium">{user.username}</h3>
            <p className="text-sm text-muted-foreground">
              {user.isOnline ? 'Online' : `Last seen ${formatDate(user.lastSeen)}`}
            </p>
          </div>
          <button className="btn btn-outline btn-sm">
            <UserMinus className="h-4 w-4 mr-2" />
            Unfollow
          </button>
        </div>
      ))}
    </div>
  )
}

export default Profile
