/**
 * Loading Spinner Component
 * Reusable loading indicator
 */

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-10 h-2',
    md: 'w-16 h-2.5',
    lg: 'w-24 h-3',
    xl: 'w-32 h-3.5',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} rounded-full bg-background-secondary overflow-hidden`}>
        <div className="h-full w-1/2 rounded-full bg-accent-brown/70 animate-pulse" />
      </div>
      {message && <p className="mt-3 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
