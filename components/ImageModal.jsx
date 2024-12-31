export default function ImageModal({ isOpen, onClose, image }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full aspect-square">
        <img
          src={image.url}
          alt="Expanded view"
          className="w-full h-full object-contain rounded-lg"
        />
        {image.tokenId && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/60 backdrop-blur-sm p-3 rounded-lg">
            <span className="text-white">NFT #{image.tokenId}</span>
            <a 
              href={`https://xt4scan.ngd.network/token/${image.contractAddress}/instance/${image.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <span>View on Explorer</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 