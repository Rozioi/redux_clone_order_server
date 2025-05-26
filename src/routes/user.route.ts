import { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import { userController } from "../controllers/user.controller";
import { TRouteFunction } from "../utils/fastify-route";
import { mongoClient } from "../app";
import { ObjectId } from "mongodb";
import { downloadFileFromGoogleDrive } from "../utils/diskToServer";
import path from "path";
import fs from "fs";
import {Throttle}  from "stream-throttle";

interface DownloadModBody extends RouteGenericInterface {
    Body: {
        url: string;
        modId: string;
    }
}

function convert(link: string): string {
  const match = link.match(/(?:\/d\/|\/file\/d\/)([a-zA-Z0-9_-]{10,})/);
  if (!match) return 'INVALID_LINK'; 
  const fileId = match[1]; 
  return `https://drive.google.com/uc?export=download&id=${fileId}`; 
}

export const UserRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
    fastify.get('/users/:id', { 
        preHandler: fastify.verifyJWT 
    }, userController.getUserById as any);

    fastify.get('/download/:file', async (req:FastifyRequest<{Params: {file:string}}>, reply:FastifyReply) => {
        const file = req.params.file;
        const filePath = path.join(__dirname, '..', 'utils', 'mods', file);
        console.log(filePath);
        if (!fs.existsSync(filePath)) {
            return reply.status(404).send('File not found');
        }
        const throttleRAte = 5 * 1024;
        const fileStream = fs.createReadStream(filePath);
        const throttleSteam = throttleRAte ? fileStream.pipe(new Throttle({ rate: throttleRAte })) : fileStream;
        
        reply.header('content-type', 'application/zip');
        reply.header('content-disposition', `attachment; filename="${file}"`);
        return reply.send(throttleSteam);
    });

    // Загрузка мода на сервер
    fastify.post<DownloadModBody>('/mods/download', {
        preHandler: fastify.verifyJWT
    }, async (req, reply) => {
        try {
            const { url, modId } = req.body;
            const driveLink = convert(url);
            
            if (driveLink === 'INVALID_LINK') {
                return reply.status(400).send({ error: 'Invalid Google Drive link' });
            }

            const fileName = `${modId}.zip`;
            await downloadFileFromGoogleDrive(driveLink, fileName);
            
            return reply.send({ 
                message: 'Mod downloaded successfully',
                fileName: fileName
            });
        } catch (error) {
            console.error('Error downloading mod:', error);
            return reply.status(500).send({ error: 'Failed to download mod' });
        }
    });

    fastify.get('/users', {
        // preHandler: fastify.verifyJWT,
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string', pattern: '^\\d+$', default: '1' },
                    limit: { type: 'string', pattern: '^\\d+$', default: '10' }
                }
            }
        }
    }, async (req, reply) => {
        try {
            const page = parseInt((req.query as any).page) || 1;
            const limit = parseInt((req.query as any).limit) || 10;
            const result = await userController.getUsersPaginated(page, limit);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    fastify.post('/auth/register', userController.createNewUser);

    fastify.put('/users/:id/status', { 
        preHandler: fastify.verifyJWT 
    }, userController.toggleAccountStatus as any);

    fastify.delete('/users/:id', { 
        preHandler: fastify.verifyJWT 
    }, userController.deleteAccount as any);

    fastify.post('/auth/login', userController.loginUser);

    fastify.get('/users/verify', { 
        preHandler: fastify.verifyJWT 
    }, userController.verifyToken);

    done();
};