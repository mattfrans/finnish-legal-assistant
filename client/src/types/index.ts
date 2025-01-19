export type LanguageMode = 'finnish' | 'english';

export interface FileAttachment {
  file: File;
  preview?: string;
}

export interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (index: number) => void;
}

export interface LanguageSelectorProps {
  value: LanguageMode;
  onChange: (mode: LanguageMode) => void;
}
