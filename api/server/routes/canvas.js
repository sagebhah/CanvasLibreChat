const express = require('express');
const { logger } = require('@librechat/data-schemas');

const router = express.Router();

router.get('/courses', async (req, res) => {
  try {
    const canvasApiKey = process.env.CANVAS_API_KEY;
    const canvasBaseUrl = process.env.CANVAS_BASE_URL;

    if (!canvasApiKey || !canvasBaseUrl) {
      return res.status(500).json({ 
        error: 'Canvas configuration not found' 
      });
    }

    // Fetch courses from Canvas API
    const response = await fetch(`https://${canvasBaseUrl}/api/v1/courses?enrollment_state=active&include[]=term`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const courses = await response.json();
    
    // Filter and format courses for the frontend
    const formattedCourses = courses
      .filter(course => course.workflow_state === 'available')
      .map(course => ({
        id: course.id,
        name: course.name,
        course_code: course.course_code,
        workflow_state: course.workflow_state,
        enrollment_term_id: course.enrollment_term_id,
      }))
      .slice(0, 20); // Limit to 20 courses for performance

    res.json(formattedCourses);
  } catch (error) {
    logger.error('Error fetching Canvas courses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch courses from Canvas LMS' 
    });
  }
});

router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    const canvasApiKey = process.env.CANVAS_API_KEY;
    const canvasBaseUrl = process.env.CANVAS_BASE_URL;
    const { courseId } = req.params;

    if (!canvasApiKey || !canvasBaseUrl) {
      return res.status(500).json({ 
        error: 'Canvas configuration not found' 
      });
    }

    // Fetch modules from Canvas API
    const response = await fetch(`https://${canvasBaseUrl}/api/v1/courses/${courseId}/modules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const modules = await response.json();
    
    // Format modules for the frontend
    const formattedModules = modules.map(module => ({
      id: module.id,
      name: module.name,
      position: module.position,
      unlock_at: module.unlock_at,
      require_sequential_progress: module.require_sequential_progress,
      state: module.state,
      completed_at: module.completed_at,
      items_count: module.items_count,
    }));

    res.json(formattedModules);
  } catch (error) {
    logger.error('Error fetching Canvas modules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch modules from Canvas LMS' 
    });
  }
});

router.get('/courses/:courseId/modules/:moduleId/items', async (req, res) => {
  try {
    const canvasApiKey = process.env.CANVAS_API_KEY;
    const canvasBaseUrl = process.env.CANVAS_BASE_URL;
    const { courseId, moduleId } = req.params;

    if (!canvasApiKey || !canvasBaseUrl) {
      return res.status(500).json({ 
        error: 'Canvas configuration not found' 
      });
    }

    // Fetch module items from Canvas API
    const response = await fetch(`https://${canvasBaseUrl}/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    
    // Format items for the frontend
    const formattedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      content_id: item.content_id,
      html_url: item.html_url,
      url: item.url,
      page_url: item.page_url,
      external_url: item.external_url,
      position: item.position,
      indent: item.indent,
      completion_requirement: item.completion_requirement,
      published: item.published,
    }));

    res.json(formattedItems);
  } catch (error) {
    logger.error('Error fetching Canvas module items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch module items from Canvas LMS' 
    });
  }
});

router.get('/files/:fileId', async (req, res) => {
  try {
    const canvasApiKey = process.env.CANVAS_API_KEY;
    const canvasBaseUrl = process.env.CANVAS_BASE_URL;
    const { fileId } = req.params;

    if (!canvasApiKey || !canvasBaseUrl) {
      return res.status(500).json({ 
        error: 'Canvas configuration not found' 
      });
    }

    // Fetch file metadata from Canvas API
    const response = await fetch(`https://${canvasBaseUrl}/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const fileData = await response.json();
    
    // Return file metadata including download URL
    res.json({
      id: fileData.id,
      filename: fileData.filename,
      display_name: fileData.display_name,
      content_type: fileData['content-type'],
      size: fileData.size,
      url: fileData.url,
      created_at: fileData.created_at,
      updated_at: fileData.updated_at,
    });
  } catch (error) {
    logger.error('Error fetching Canvas file:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file from Canvas LMS' 
    });
  }
});

const { requireJwtAuth } = require('~/server/middleware');

router.post('/files/:fileId/download-and-upload', requireJwtAuth, async (req, res) => {
  try {
    const canvasApiKey = process.env.CANVAS_API_KEY;
    const canvasBaseUrl = process.env.CANVAS_BASE_URL;
    const { fileId } = req.params;

    if (!canvasApiKey || !canvasBaseUrl) {
      return res.status(500).json({ 
        error: 'Canvas configuration not found' 
      });
    }

    // Get Canvas file metadata
    const fileResponse = await fetch(`https://${canvasBaseUrl}/api/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!fileResponse.ok) {
      throw new Error(`Canvas API error: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const fileData = await fileResponse.json();

    // Download file content from Canvas
    const downloadResponse = await fetch(fileData.url);
    if (!downloadResponse.ok) {
      throw new Error(`File download error: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }

    const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer());

    // Use LibreChat's internal upload processing
    const { processFileUpload } = require('~/server/services/Files/process');
    const path = require('path');
    const fs = require('fs');
    
    // Create temporary file
    const tempDir = path.join(req.app.locals.paths.uploads, 'temp', req.user.id);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, fileData.filename);
    fs.writeFileSync(tempFilePath, fileBuffer);

    // Mock req.file object for multer compatibility
    req.file = {
      path: tempFilePath,
      filename: fileData.filename,
      originalname: fileData.display_name || fileData.filename,
      mimetype: fileData['content-type'],
      size: fileData.size,
    };

    const crypto = require('crypto');
    req.file_id = crypto.randomUUID();

    const metadata = {
      endpoint: req.body.endpoint || 'openAI',
      tool_resource: req.body.tool_resource || 'file_search',
      file_id: req.file_id,
      temp_file_id: req.file_id,
    };

    // Store original file info for response
    const originalFileInfo = {
      id: fileData.id,
      filename: fileData.filename,
      display_name: fileData.display_name,
    };

    // Override res.json to add original file info
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const enhancedData = {
        ...data,
        originalFile: originalFileInfo,
        message: `File "${fileData.display_name}" uploaded successfully to file search!`,
      };
      return originalJson(enhancedData);
    };

    // Process upload through LibreChat's system
    await processFileUpload({ req, res, metadata });

    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      logger.warn('Failed to clean up temp file:', cleanupError);
    }

  } catch (error) {
    logger.error('Error uploading Canvas file to LibreChat:', error);
    res.status(500).json({ 
      error: 'Failed to upload file to LibreChat',
      details: error.message,
    });
  }
});

module.exports = router;