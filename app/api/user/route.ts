import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '@/services/databaseService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return getUser(req, res);
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
    try {
        const user =  databaseService.getUserById(req.body.id)
        res.status(200).json(user)
    } catch (e){
        res.status(400).json(e)
    }
}
