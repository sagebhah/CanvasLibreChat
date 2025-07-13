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

module.exports = router;