import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../utils/dbConnect';
import Image from '../../../../models/Image';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { imageId, userAddress, voteType } = req.body;

    if (!imageId || !userAddress || ![-1, 1].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update votes
    const currentVote = image.votes.get(userAddress) || 0;
    image.votes.set(userAddress, voteType);
    
    // Update score
    image.score = image.score - currentVote + voteType;
    await image.save();

    return res.status(200).json({
      success: true,
      score: image.score
    });

  } catch (error: any) {
    console.error('Vote error:', error);
    return res.status(500).json({ error: 'Failed to vote' });
  }
} 