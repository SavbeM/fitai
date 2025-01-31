import {aiService} from '@/services/aiService';
import { describe, it, expect } from '@jest/globals';

describe('AI Service', () => {
    it('should return a completion message', async () => {
        const result = await aiService();
        console.log(result.choices[0].message.content);
        expect(result.choices[0].message).toBeDefined();
    });
});