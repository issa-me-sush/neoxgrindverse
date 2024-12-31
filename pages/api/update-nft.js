import dbConnect from '../../utils/dbConnect';
import Image from '../../models/Image';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { placeId, tokenId, contractAddress, cid } = req.body;

    console.log('Updating NFT info:', { placeId, tokenId, cid });

    // Update image document using CID
    const imageUpdate = await Image.findOneAndUpdate(
      { cid: cid },
      {
        $set: {
          tokenId: tokenId,
          contractAddress: contractAddress,
          isNFT: true
        }
      },
      { new: true }
    );

    if (!imageUpdate) {
      throw new Error('Image not found with CID: ' + cid);
    }

    console.log('Image updated with NFT info:', imageUpdate);

    res.status(200).json({ 
      success: true,
      image: imageUpdate
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Failed to update NFT info',
      error: error.message
    });
  }
} 