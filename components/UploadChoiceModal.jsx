import { Dialog } from '@headlessui/react';

export default function UploadChoiceModal({ isOpen, onClose, onUpload, onUploadAndMint }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Upload Options
          </Dialog.Title>

          <div className="space-y-4">
            <button
              onClick={onUpload}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Just Upload
            </button>

            <button
              onClick={onUploadAndMint}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Upload & Mint as NFT
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            You can always mint your upload as an NFT later
          </p>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 