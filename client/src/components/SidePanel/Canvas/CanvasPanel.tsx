import { useState, useEffect } from 'react';
import { useLocalize } from '~/hooks';

interface Course {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  enrollment_term_id: number;
}

const CanvasPanel = () => {
  const localize = useLocalize();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Fetch courses from Canvas API
        const response = await fetch('/api/canvas/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-sm">
        Error loading courses: {error}
      </div>
    );
  }

  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      <div className="p-4 space-y-3">
        {courses.length === 0 ? (
          <div className="text-sm text-text-secondary">
            No courses found
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-3 rounded-lg border border-border-light hover:border-border-medium transition-colors cursor-pointer"
              >
                <div className="text-sm font-medium text-text-primary break-words">
                  {course.name}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {course.course_code}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasPanel;