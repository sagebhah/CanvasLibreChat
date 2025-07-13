import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Video, Link, File, BookOpen } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface Course {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  enrollment_term_id: number;
}

interface Module {
  id: number;
  name: string;
  position: number;
  unlock_at: string | null;
  require_sequential_progress: boolean;
  state: string;
  completed_at: string | null;
  items_count: number;
}

interface ModuleItem {
  id: number;
  title: string;
  type: string;
  content_id: number;
  html_url: string;
  url: string;
  page_url: string;
  external_url: string;
  position: number;
  indent: number;
  completion_requirement: any;
  published: boolean;
}

type ViewType = 'courses' | 'modules' | 'items';

const CanvasPanel = () => {
  const localize = useLocalize();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
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

    if (currentView === 'courses') {
      fetchCourses();
    }
  }, [currentView]);

  const fetchModules = async (courseId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/canvas/courses/${courseId}/modules`);
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data = await response.json();
      setModules(data);
      setCurrentView('modules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleItems = async (courseId: number, moduleId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/canvas/courses/${courseId}/modules/${moduleId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch module items');
      }
      const data = await response.json();
      setItems(data);
      setCurrentView('items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    fetchModules(course.id);
  };

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module);
    if (selectedCourse) {
      fetchModuleItems(selectedCourse.id, module.id);
    }
  };

  const handleBackClick = () => {
    if (currentView === 'items') {
      setCurrentView('modules');
      setSelectedModule(null);
    } else if (currentView === 'modules') {
      setCurrentView('courses');
      setSelectedCourse(null);
      setModules([]);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'Page':
        return FileText;
      case 'Assignment':
        return BookOpen;
      case 'Discussion':
        return FileText;
      case 'ExternalUrl':
        return Link;
      case 'File':
        return File;
      case 'ExternalTool':
        return Link;
      default:
        return FileText;
    }
  };

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

  const renderHeader = () => {
    if (currentView === 'courses') return null;
    
    return (
      <div className="flex items-center justify-between p-3 border-b border-border-light">
        <button
          onClick={handleBackClick}
          className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <div className="text-sm font-medium text-text-primary truncate ml-2">
          {currentView === 'modules' && selectedCourse?.name}
          {currentView === 'items' && selectedModule?.name}
        </div>
      </div>
    );
  };

  const renderCourses = () => (
    <div className="space-y-2">
      {courses.map((course) => (
        <div
          key={course.id}
          onClick={() => handleCourseClick(course)}
          className="p-3 rounded-lg border border-border-light hover:border-border-medium transition-colors cursor-pointer"
        >
          <div className="text-sm font-medium text-text-primary break-words">
            {course.name}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {course.course_code}
          </div>
          <div className="flex items-center justify-end mt-2">
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderModules = () => (
    <div className="space-y-2">
      {modules.map((module) => (
        <div
          key={module.id}
          onClick={() => handleModuleClick(module)}
          className="p-3 rounded-lg border border-border-light hover:border-border-medium transition-colors cursor-pointer"
        >
          <div className="text-sm font-medium text-text-primary break-words">
            {module.name}
          </div>
          {module.items_count > 0 && (
            <div className="text-xs text-text-secondary mt-1">
              {module.items_count} item{module.items_count !== 1 ? 's' : ''}
            </div>
          )}
          <div className="flex items-center justify-end mt-2">
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderItems = () => (
    <div className="space-y-2">
      {items.map((item) => {
        const IconComponent = getItemIcon(item.type);
        return (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-border-light hover:border-border-medium transition-colors"
            style={{ marginLeft: `${item.indent * 12}px` }}
          >
            <div className="flex items-start space-x-2">
              <IconComponent className="h-4 w-4 text-text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary break-words">
                  {item.title}
                </div>
                <div className="text-xs text-text-secondary mt-1 capitalize">
                  {item.type.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      {renderHeader()}
      <div className="p-4 space-y-3">
        {currentView === 'courses' && courses.length === 0 && !loading && (
          <div className="text-sm text-text-secondary">
            No courses found
          </div>
        )}
        {currentView === 'modules' && modules.length === 0 && !loading && (
          <div className="text-sm text-text-secondary">
            No modules found
          </div>
        )}
        {currentView === 'items' && items.length === 0 && !loading && (
          <div className="text-sm text-text-secondary">
            No items found
          </div>
        )}
        
        {currentView === 'courses' && courses.length > 0 && renderCourses()}
        {currentView === 'modules' && modules.length > 0 && renderModules()}
        {currentView === 'items' && items.length > 0 && renderItems()}
      </div>
    </div>
  );
};

export default CanvasPanel;