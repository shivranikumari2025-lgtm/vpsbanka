// This component is no longer used - class creation is inline in ClassesPage.
// Kept for backward compatibility.
import React from 'react';

interface Props { onClose: () => void; onSuccess: () => void; }

const CreateClassModal: React.FC<Props> = ({ onClose }) => {
  onClose();
  return null;
};

export default CreateClassModal;
