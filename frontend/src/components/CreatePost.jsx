import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { X, Image, Sparkles } from 'lucide-react'
import { postsAPI, generateAPI } from '../utils/api'
import { cn } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const CreatePost = ({ onClose, onSuccess }) => {
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState('')

  const createPostMutation = useMutation({
    mutationFn: postsAPI.createPost,
    onSuccess: () => {
      toast.success('Post created successfully!')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post')
    },
  })

  const generateImageMutation = useMutation({
    mutationFn: generateAPI.generateImage,
    onSuccess: (response) => {
      setImage(response.data.image)
      setIsGeneratingImage(false)
      toast.success('Image generated successfully!')
    },
    onError: (error) => {
      setIsGeneratingImage(false)
      toast.error(error.response?.data?.message || 'Failed to generate image')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    createPostMutation.mutate({
      content,
      image,
      isGeneratedImage: !!image && !!generationPrompt,
      generationPrompt: generationPrompt || ''
    })
  }

  const handleGenerateImage = async () => {
    if (!generationPrompt.trim()) {
      toast.error('Please enter a prompt for image generation')
      return
    }

    setIsGeneratingImage(true)
    generateImageMutation.mutate({
      prompt: generationPrompt,
      negativePrompt: '',
      numInferenceSteps: 20,
      guidanceScale: 7.5
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Create Post</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[120px] input resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {content.length}/1000 characters
              </span>
            </div>
          </div>

          {/* Image Generation Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Generate AI Image</h3>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="input"
                maxLength={200}
              />
              
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !generationPrompt.trim()}
                className="btn btn-outline btn-sm"
              >
                {isGeneratingImage ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Image Preview */}
          {image && (
            <div className="space-y-2">
              <h4 className="font-medium">Generated Image:</h4>
              <div className="relative">
                <img
                  src={image}
                  alt="Generated content"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage('')
                    setGenerationPrompt('')
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isLoading || !content.trim()}
              className="btn btn-primary"
            >
              {createPostMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Posting...</span>
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
