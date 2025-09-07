const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Hugging Face API configuration
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
const HUGGING_FACE_HEADERS = {
  'Authorization': `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
  'Content-Type': 'application/json'
};

// @route   POST /api/generate/image
// @desc    Generate image from text using Hugging Face API
// @access  Private
router.post('/image', [
  authMiddleware,
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Prompt must be between 5 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { prompt, negativePrompt = '', numInferenceSteps = 20, guidanceScale = 7.5 } = req.body;

    // Check if Hugging Face API token is configured
    if (!process.env.HUGGING_FACE_API_TOKEN) {
      return res.status(500).json({ 
        message: 'Image generation service not configured. Please contact administrator.' 
      });
    }

    // Prepare the request payload
    const payload = {
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        num_inference_steps: Math.min(Math.max(numInferenceSteps, 10), 50),
        guidance_scale: Math.min(Math.max(guidanceScale, 1), 20),
        width: 512,
        height: 512
      }
    };

    console.log('Generating image with prompt:', prompt);

    // Make request to Hugging Face API
    const response = await axios.post(HUGGING_FACE_API_URL, payload, {
      headers: HUGGING_FACE_HEADERS,
      timeout: 60000, // 60 seconds timeout
      responseType: 'arraybuffer'
    });

    // Check if the response is successful
    if (response.status !== 200) {
      throw new Error(`Hugging Face API returned status ${response.status}`);
    }

    // Convert the image buffer to base64
    const imageBuffer = Buffer.from(response.data);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log('Image generated successfully');

    res.json({
      message: 'Image generated successfully',
      image: dataUrl,
      prompt: prompt,
      metadata: {
        negativePrompt,
        numInferenceSteps,
        guidanceScale,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);

    // Handle specific Hugging Face API errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 503) {
        return res.status(503).json({ 
          message: 'Image generation service is currently unavailable. Please try again later.',
          error: 'Service temporarily unavailable'
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          message: 'Too many requests. Please wait a moment before trying again.',
          error: 'Rate limit exceeded'
        });
      } else if (status === 400) {
        return res.status(400).json({ 
          message: 'Invalid prompt or parameters. Please check your input.',
          error: 'Bad request'
        });
      } else {
        return res.status(500).json({ 
          message: 'Image generation failed. Please try again.',
          error: 'External API error'
        });
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        message: 'Image generation timed out. Please try again with a simpler prompt.',
        error: 'Request timeout'
      });
    }

    // Handle other errors
    res.status(500).json({ 
      message: 'Image generation failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/generate/models
// @desc    Get available image generation models
// @access  Public
router.get('/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'High-quality image generation model',
        maxPromptLength: 200,
        supportedFormats: ['PNG', 'JPEG'],
        dimensions: ['512x512', '768x768', '1024x1024']
      }
    ],
    defaultModel: 'stabilityai/stable-diffusion-xl-base-1.0'
  });
});

// @route   POST /api/generate/validate-prompt
// @desc    Validate prompt before generation
// @access  Private
router.post('/validate-prompt', [
  authMiddleware,
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Prompt must be between 5 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { prompt } = req.body;

    // Basic content filtering (you can enhance this)
    const inappropriateWords = ['nsfw', 'explicit', 'adult', 'violence', 'hate'];
    const lowerPrompt = prompt.toLowerCase();
    
    const hasInappropriateContent = inappropriateWords.some(word => 
      lowerPrompt.includes(word)
    );

    if (hasInappropriateContent) {
      return res.status(400).json({ 
        message: 'Prompt contains inappropriate content. Please modify your prompt.',
        isValid: false
      });
    }

    res.json({
      message: 'Prompt is valid',
      isValid: true,
      suggestions: [
        'Try to be more specific about the style',
        'Include details about lighting and mood',
        'Specify the art style (realistic, cartoon, anime, etc.)'
      ]
    });

  } catch (error) {
    console.error('Prompt validation error:', error);
    res.status(500).json({ 
      message: 'Error validating prompt',
      error: 'Internal server error'
    });
  }
});

module.exports = router;
