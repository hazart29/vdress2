import React from 'react';

const Loading = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-100"> {/* Loading Overlay */}
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div> {/* Loading Spinner */}
  </div>
);

export default Loading;