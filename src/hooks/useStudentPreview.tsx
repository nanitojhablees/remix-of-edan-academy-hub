import { createContext, useContext, useState, ReactNode } from "react";

interface StudentPreviewContextType {
  isStudentPreview: boolean;
  toggleStudentPreview: () => void;
  setStudentPreview: (value: boolean) => void;
}

const StudentPreviewContext = createContext<StudentPreviewContextType>({
  isStudentPreview: false,
  toggleStudentPreview: () => {},
  setStudentPreview: () => {},
});

export function StudentPreviewProvider({ children }: { children: ReactNode }) {
  const [isStudentPreview, setIsStudentPreview] = useState(false);

  const toggleStudentPreview = () => setIsStudentPreview((v) => !v);
  const handleSetStudentPreview = (value: boolean) => setIsStudentPreview(value);

  return (
    <StudentPreviewContext.Provider value={{ isStudentPreview, toggleStudentPreview, setStudentPreview: handleSetStudentPreview }}>
      {children}
    </StudentPreviewContext.Provider>
  );
}

export function useStudentPreview() {
  return useContext(StudentPreviewContext);
}
