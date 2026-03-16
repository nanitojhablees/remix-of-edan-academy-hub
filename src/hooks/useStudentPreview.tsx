import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface StudentPreviewContextType {
  isStudentPreview: boolean;
  toggleStudentPreview: () => void;
  setStudentPreview: (value: boolean) => void;
}

const STORAGE_KEY = "edan-student-preview";

const StudentPreviewContext = createContext<StudentPreviewContextType>({
  isStudentPreview: false,
  toggleStudentPreview: () => {},
  setStudentPreview: () => {},
});

export function StudentPreviewProvider({ children }: { children: ReactNode }) {
  const [isStudentPreview, setIsStudentPreview] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(isStudentPreview));
    } catch {}
  }, [isStudentPreview]);

  const toggleStudentPreview = useCallback(() => setIsStudentPreview((v) => !v), []);
  const handleSetStudentPreview = useCallback((value: boolean) => setIsStudentPreview(value), []);

  return (
    <StudentPreviewContext.Provider value={{ isStudentPreview, toggleStudentPreview, setStudentPreview: handleSetStudentPreview }}>
      {children}
    </StudentPreviewContext.Provider>
  );
}

export function useStudentPreview() {
  return useContext(StudentPreviewContext);
}
