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

  return (
    <StudentPreviewContext.Provider value={{ isStudentPreview, toggleStudentPreview, setStudentPreview }}>
      {children}
    </StudentPreviewContext.Provider>
  );
}

export function useStudentPreview() {
  return useContext(StudentPreviewContext);
}
