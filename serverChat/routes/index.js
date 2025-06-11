import express from 'express';
import interfaceController from '../controllers/interfaceController.js';
const router = express.Router();

function useRouteInterface(){
    router.get('/', interfaceController.index);
    return router;
}
export default useRouteInterface;