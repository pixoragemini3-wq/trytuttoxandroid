import React from 'react';

interface ArticleSkeletonProps {
  type?: 'standard' | 'horizontal' | 'hero' | 'sidebar';
  className?: string;
}

const ArticleSkeleton: React.FC<ArticleSkeletonProps> = ({ type = 'standard', className = '' }) => {
  
  // SIDEBAR SKELETON
  if (type === 'sidebar') {
    return (
      <div className={`flex gap-3 items-center shrink-0 w-full animate-pulse ${className}`}>
         <div className="w-6 h-8 bg-black/10 rounded shrink-0"></div>
         <div className="flex-1 pt-0.5 border-t border-black/5">
            <div className="h-4 bg-black/10 rounded w-full mb-1"></div>
            <div className="h-4 bg-black/10 rounded w-2/3"></div>
         </div>
      </div>
    );
  }

  // HERO SKELETON
  if (type === 'hero') {
    return (
      <div className={`w-full h-full lg:rounded-[2rem] bg-white flex flex-col md:flex-row shadow-xl overflow-hidden animate-pulse ${className}`}>
        {/* Image Section */}
        <div className="w-full md:w-[50%] lg:w-[60%] aspect-video md:aspect-auto md:h-full bg-gray-200 shrink-0"></div>
        
        {/* Content Section */}
        <div className="w-full md:w-[50%] lg:w-[40%] p-5 md:p-6 lg:p-8 bg-gray-100 flex flex-col justify-between">
          <div className="flex flex-col items-start w-full space-y-4">
             {/* Category Tag */}
             <div className="h-4 w-20 bg-gray-300 rounded"></div>

             {/* Title */}
             <div className="w-full space-y-2">
                <div className="h-8 md:h-10 bg-gray-300 rounded w-full"></div>
                <div className="h-8 md:h-10 bg-gray-300 rounded w-3/4"></div>
                <div className="h-8 md:h-10 bg-gray-300 rounded w-1/2"></div>
             </div>
            
            {/* Excerpt */}
            <div className="hidden md:block w-full space-y-2 mt-4">
               <div className="h-3 bg-gray-300 rounded w-full"></div>
               <div className="h-3 bg-gray-300 rounded w-full"></div>
               <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
          
          {/* Bottom Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 w-full flex justify-between items-end">
            <div className="h-3 w-24 bg-gray-300 rounded"></div>
            <div className="h-3 w-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // HORIZONTAL (CAROUSEL) SKELETON
  if (type === 'horizontal') {
    return (
      <div className={`relative w-full aspect-square md:aspect-[4/5] overflow-hidden rounded-xl lg:rounded-2xl bg-gray-200 shrink-0 animate-pulse ${className}`}>
        <div className="absolute bottom-0 left-0 p-3 lg:p-4 w-full flex flex-col items-start space-y-2">
           <div className="h-3 w-16 bg-gray-300 rounded"></div>
           <div className="h-5 w-full bg-gray-300 rounded"></div>
           <div className="h-5 w-2/3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // STANDARD SKELETON
  return (
    <div className={`flex flex-col md:flex-row gap-4 h-full p-3 rounded-2xl border border-gray-100 bg-white animate-pulse ${className}`}>
      {/* Image */}
      <div className="w-full md:w-[35%] aspect-video md:aspect-[4/3] rounded-xl bg-gray-200 shrink-0"></div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center py-2 space-y-3">
        {/* Category */}
        <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
        
        {/* Title */}
        <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        {/* Excerpt */}
        <div className="hidden md:block space-y-2 mt-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-2">
           <div className="w-4 h-4 rounded-full bg-gray-200"></div>
           <div className="h-2 w-16 bg-gray-200 rounded"></div>
           <div className="h-2 w-2 bg-gray-200 rounded-full mx-1"></div>
           <div className="h-2 w-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ArticleSkeleton;
