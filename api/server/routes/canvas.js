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

module.exports = router;