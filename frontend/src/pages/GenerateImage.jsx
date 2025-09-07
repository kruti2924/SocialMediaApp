import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Settings, 
  Image as ImageIcon,
  Copy,
  Share2
} from 'lucide-react'
import { generateAPI } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const GenerateImage = () => {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [numInferenceSteps, setNumInferenceSteps] = useState(20)
  const [guidanceScale, setGuidanceScale] = useState(7.5)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const generateMutation = useMutation({
    mutationFn: generateAPI.generateImage,
    onSuccess: (response) => {
      setGeneratedImage(response.data)
      toast.success('Image generated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate image')
    },
  })

  const validateMutation = useMutation({
    mutationFn: generateAPI.validatePrompt,
    onSuccess: (response) => {
      if (response.data.isValid) {
        toast.success('Prompt is valid!')
      } else {
        toast.error(response.data.message)
      }
    },
    onError: () => {
      toast.error('Failed to validate prompt')
    },
  })

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    generateMutation.mutate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      numInferenceSteps,
      guidanceScale
    })
  }

  const handleValidate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    validateMutation.mutate(prompt.trim())
  }

  const handleDownload = () => {
    if (generatedImage?.image) {
      const link = document.createElement('a')
      link.href = generatedImage.image
      link.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Image downloaded!')
    }
  }

  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt)
      toast.success('Prompt copied to clipboard!')
    }
  }

  const handleShare = () => {
    if (generatedImage?.image) {
      navigator.clipboard.writeText(generatedImage.image)
      toast.success('Image URL copied to clipboard!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">AI Image Generator</h1>
        <p className="text-muted-foreground">
          Create stunning images from text descriptions using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Image</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn btn-outline btn-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
            
            <div className="card-content space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe your image *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A beautiful sunset over mountains, digital art style..."
                  className="w-full h-32 input resize-none"
                  maxLength={200}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {prompt.length}/200 characters
                  </span>
                  <button
                    onClick={handleCopyPrompt}
                    disabled={!prompt.trim()}
                    className="btn btn-ghost btn-sm"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Negative Prompt (optional)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, low quality, distorted..."
                  className="input"
                  maxLength={200}
                />
              </div>

              {/* Advanced Settings */}
              {showSettings && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium">Advanced Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Inference Steps: {numInferenceSteps}
                        </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={numInferenceSteps}
                      onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values = better quality but slower generation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Guidance Scale: {guidanceScale}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values = closer to prompt but potentially less creative
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleValidate}
                  disabled={validateMutation.isLoading || !prompt.trim()}
                  className="btn btn-outline flex-1"
                >
                  {validateMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Validate Prompt'
                  )}
                </button>
                
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isLoading || !prompt.trim()}
                  className="btn btn-primary flex-1"
                >
                  {generateMutation.isLoading ? (
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
          </div>

          {/* Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Tips for Better Results</h3>
            </div>
            <div className="card-content">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be specific about style, lighting, and mood</li>
                <li>• Include art style keywords (realistic, cartoon, anime, etc.)</li>
                <li>• Mention colors, composition, and atmosphere</li>
                <li>• Use negative prompts to avoid unwanted elements</li>
                <li>• Try different inference steps for quality vs speed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generated Image</h2>
                {generatedImage && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleShare}
                      className="btn btn-outline btn-sm"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="btn btn-primary btn-sm"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card-content">
              {generateMutation.isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <LoadingSpinner size="xl" />
                  <p className="text-muted-foreground">Generating your image...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take 30-60 seconds
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <img
                    src={generatedImage.image}
                    alt="Generated content"
                    className="w-full rounded-lg"
                  />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Prompt Used:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {generatedImage.prompt}
                    </p>
                    
                    {generatedImage.metadata && (
                      <div className="text-xs text-muted-foreground">
                        <p>Generated: {new Date(generatedImage.metadata.generatedAt).toLocaleString()}</p>
                        <p>Steps: {generatedImage.metadata.numInferenceSteps}</p>
                        <p>Guidance: {generatedImage.metadata.guidanceScale}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Your generated image will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Generations */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Recent Generations</h3>
            </div>
            <div className="card-content">
              <p className="text-sm text-muted-foreground">
                Your recent generations will be saved here for easy access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateImage
