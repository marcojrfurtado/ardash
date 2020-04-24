import React from "react";
import { ArrowDownward } from '@material-ui/icons'
// Import the useDropzone hooks from react-dropzone
import { useDropzone } from "react-dropzone";

const Dropzone = ({ onDrop, onDropRejected, accept, maxSize, content }) => {
  // Initializing useDropzone hooks with options
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize
  });

  /* 
    useDropzone hooks exposes two functions called getRootProps and getInputProps
    and also exposes isDragActive boolean
  */
  return (
    <div {...getRootProps()}>
      <input className="dropzone-input" {...getInputProps()} />
      <div className="text-center">
        {isDragActive ? (
          <div className="dropzone-content">
            <ArrowDownward></ArrowDownward>
          </div>
        ) : (
          <div className="dropzone-content">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;