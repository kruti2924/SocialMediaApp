import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Heart, MessageCircle, Share, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { postsAPI } from '../utils/api'
import { formatDate, generateAvatarUrl, cn } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import CreatePost from '../components/CreatePost'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Home = () => {
  const [page, setPage] = useState(1)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: postsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => postsAPI.getPosts(page, 10),
    keepPreviousData: true,
  })

  const likeMutation = useMutation({
    mutationFn: postsAPI.likePost,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: postsAPI.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success('Post deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete post')
    },
  })

  const handleLike = (postId, isLiked) => {
    likeMutation.mutate(postId)
  }

  const handleDelete = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(postId)
    }
  }

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      setPage(prev => prev + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load posts. Please try again.</p>
      </div>
    )
  }

  const posts = postsData?.data?.posts || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Button */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <img
              className="h-10 w-10 rounded-full"
              src={user?.profilePicture || generateAvatarUrl(user?.username)}
              alt={user?.username}
            />
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 text-left text-muted-foreground bg-muted rounded-full px-4 py-2 hover:bg-accent transition-colors"
            >
              What's on your mind?
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUser={user}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={isFetchingNextPage}
            className="btn btn-outline"
          >
            {isFetchingNextPage ? <LoadingSpinner size="sm" /> : 'Load More'}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false)
            queryClient.invalidateQueries(['posts'])
          }}
        />
      )}
    </div>
  )
}

const PostCard = ({ post, currentUser, onLike, onDelete }) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(
    post.likes.some(like => like._id === currentUser.id)
  )

  const isAuthor = post.author._id === currentUser.id

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike(post._id, isLiked)
  }

  const handleDelete = () => {
    onDelete(post._id)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              className="h-10 w-10 rounded-full"
              src={post.author.profilePicture || generateAvatarUrl(post.author.username)}
              alt={post.author.username}
            />
            <div>
              <h3 className="font-semibold">{post.author.username}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(post.createdAt)}
                {post.isEdited && <span className="ml-1">(edited)</span>}
              </p>
            </div>
          </div>
          
          {isAuthor && (
            <div className="relative">
              <button className="p-1 hover:bg-accent rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {/* Dropdown menu would go here */}
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        
        {post.image && (
          <div className="mt-4">
            <img
              src={post.image}
              alt="Post image"
              className="rounded-lg w-full max-h-96 object-cover"
            />
            {post.isGeneratedImage && (
              <p className="text-xs text-muted-foreground mt-2">
                Generated from: "{post.generationPrompt}"
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center space-x-2 hover:text-primary transition-colors",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              <span>{post.likes.length}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments.length}</span>
            </button>
            
            <button className="flex items-center space-x-2 hover:text-primary transition-colors">
              <Share className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>

          {isAuthor && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                title="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t p-4 space-y-4">
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <img
                  className="h-6 w-6 rounded-full"
                  src={comment.author.profilePicture || generateAvatarUrl(comment.author.username)}
                  alt={comment.author.username}
                />
                <div className="flex-1">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-sm font-medium">{comment.author.username}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <img
              className="h-6 w-6 rounded-full"
              src={currentUser.profilePicture || generateAvatarUrl(currentUser.username)}
              alt={currentUser.username}
            />
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 input text-sm"
              />
              <button
                disabled={!commentText.trim()}
                className="btn btn-primary btn-sm"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
