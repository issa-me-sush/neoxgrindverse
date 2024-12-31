import { useState, useEffect, useRef } from 'react';
import { useUser } from "@account-kit/react";
import { ethers } from 'ethers';
import Image from 'next/image';
import UploadChoiceModal from '../UploadChoiceModal';
import { CONTRACT_ADDRESS, ABI } from '../../contracts/abi';
import ImageModal from '../ImageModal';
import { UserIcon } from '@heroicons/react/16/solid';
function NFTBadge({ tokenId }) {
  const explorerUrl = `https://xt4scan.ngd.network/token/${CONTRACT_ADDRESS}/instance/${tokenId}`;
  
  return (
    <a 
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute top-2 right-2 px-3 py-1 rounded-full 
        text-xs font-bold text-white  transform hover:scale-105 transition-all
        flex items-center gap-2 hover:bg-purple-400/80 group"
    >
      {/* <span className="animate-pulse">⬡</span> */}
      {/* <span>NFT #{tokenId}</span> */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
    </a>
  );
}

export function CommunityPanel({ landmark }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch existing messages and images
  useEffect(() => {
    if (landmark?.place_id) {
      fetchMessages();
      fetchImages();
    }
  }, [landmark?.place_id]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/community/${landmark.place_id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/community/${landmark.place_id}/images`);
      const data = await res.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const handleUpload = async (shouldMint = false) => {
    setIsModalOpen(false);
    setIsUploading(true);
    
    try {
      if (!selectedFile || !landmark?.place_id || !user?.address) {
        throw new Error('Missing required fields');
      }

      // First upload to Pinata
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('placeId', landmark.place_id);
      formData.append('userAddress', user.address);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);

      if (shouldMint) {
        // Get signer and contract
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        // Mint NFT and wait for event
        const tx = await contract.mintLocationNFT(
          landmark.place_id,
          `ipfs://${data.cid}`
        );
        const receipt = await tx.wait();
        
        // Find the LocationNFTMinted event
        const event = receipt.events?.find(e => e.event === 'LocationNFTMinted');
        if (event) {
          const tokenId = event.args.tokenId.toString();
          console.log('NFT minted with token ID:', tokenId);
          
          // Update the database with token ID using CID
          const updateResponse = await fetch('/api/update-nft', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              placeId: landmark.place_id,
              tokenId: tokenId,
              contractAddress: CONTRACT_ADDRESS,
              cid: data.cid // Use CID instead of imageId
            }),
          });

          if (!updateResponse.ok) {
            console.error('Failed to update NFT info in database');
          }
        }
      }

      // Refresh images
      await fetchImages();
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload/mint image');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.address) return;

    try {
      const res = await fetch('/api/community/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: landmark.place_id,
          userAddress: user.address,
          message: newMessage.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      setMessages(prev => [...prev, {
        userAddress: user.address,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <div className="space-y-6">
        {/* Community Chat */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-bold text-purple-400 mb-4">Community Chat</h3>
        
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex gap-3 ${msg.userAddress === user?.address ? 'flex-row-reverse' : ''}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
             <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`
                max-w-[70%] rounded-2xl px-4 py-2
                ${msg.userAddress === user?.address 
                  ? 'bg-purple-600/30 rounded-tr-none' 
                  : 'bg-black/30 rounded-tl-none'}
              `}>
                <div className="text-sm text-gray-400 mb-1">
                  {msg.userAddress.slice(0, 6)}...{msg.userAddress.slice(-4)}
                </div>
                <div className="text-white">{msg.message}</div>
              </div>
            </div>
          ))}
        </div>

        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            Connect wallet to join the conversation
          </div>
        )}
      </div>
      {/* Image Gallery */}
      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 backdrop-blur-sm border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-400">Community Gallery</h3>
          <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? 'Uploading...' : 'Add Photo'}
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <div 
              key={idx} 
              className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer
                ${image.tokenId ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-black/50' : ''}
                transform transition-all duration-300 hover:scale-[1.02]
                ${image.tokenId ? 'hover:ring-purple-400 hover:shadow-xl hover:shadow-purple-500/20' : ''}
              `}
              onClick={() => setSelectedImage(image)}
            >
              {image.tokenId && (
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <NFTBadge tokenId={image.tokenId} />
                  <a 
                    href={`https://xt4scan.ngd.network/token/${CONTRACT_ADDRESS}/instance/${image.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-black/60 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              )}
              
              <div className={`absolute inset-0 ${image.tokenId ? 'animate-gradient-xy' : ''}`}>
                <Image
                  src={image.url}
                  alt={`Community photo ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-300
                    ${image.tokenId ? 'group-hover:scale-105' : ''}
                  `}
                  onError={(e) => {
                    console.log('Image error:', image.url);
                    const currentSrc = e.currentTarget.src;
                    if (currentSrc.includes('ipfs.io')) {
                      e.currentTarget.src = currentSrc.replace(
                        'ipfs.io',
                        'dweb.link'
                      );
                    } else if (currentSrc.includes('dweb.link')) {
                      e.currentTarget.src = currentSrc.replace(
                        'dweb.link',
                        'cloudflare-ipfs.com'
                      );
                    }
                  }}
                  onLoad={() => console.log('Image loaded:', image.url)}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
              >
                <div className="text-xs text-gray-300 flex items-center justify-between">
                  <span>By {image.userAddress.slice(0, 6)}...{image.userAddress.slice(-4)}</span>
                  {image.tokenId && (
                    <span className="text-purple-300 font-medium">
                      NFT
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-2">
            Debug - Images: {JSON.stringify(images, null, 2)}
          </div>
        )} */}
      </div>

      

      <UploadChoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={() => handleUpload(false)}
        onUploadAndMint={() => handleUpload(true)}
      />

      <ImageModal 
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
      />
    </div>
  );
} 