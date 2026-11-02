import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title
    
    // Cleanup: volta ao título original quando o componente é desmontado
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};