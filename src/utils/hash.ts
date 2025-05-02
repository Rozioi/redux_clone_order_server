import bcrypt from 'bcrypt';
import { config } from '../config/env';

const saltRounds = config.SALT_ROUNDS;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}

export async function compareHash(password: string, hash_password: string): Promise<boolean> {
    return bcrypt.compare(password, hash_password);
};