import express from 'express';
import facebookService from '../services/facebook.js';

const router = express.Router();

/**
 * GET /api/facebook/posts/:pageId
 * Busca posts de uma página específica
 */
router.get('/posts/:pageId', async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { limit = 25 } = req.query;
    
    const posts = await facebookService.getPagePosts(pageId, parseInt(limit));
    
    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/posts
 * Busca posts de múltiplas páginas
 */
router.get('/posts', async (req, res, next) => {
  try {
    const pageIds = process.env.SOURCE_PAGE_IDS?.split(',') || [];
    const { limit = 10 } = req.query;
    
    if (pageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No source pages configured. Add SOURCE_PAGE_IDS to .env'
      });
    }
    
    const posts = await facebookService.getMultiplePagesPosts(pageIds, parseInt(limit));
    
    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/pages
 * Lista todas as páginas que o usuário administra
 */
router.get('/pages', async (req, res, next) => {
  try {
    const pages = await facebookService.getUserPages();
    
    res.json({
      success: true,
      count: pages.length,
      pages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/page/:pageId
 * Busca informações de uma página
 */
router.get('/page/:pageId', async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const pageInfo = await facebookService.getPageInfo(pageId);
    
    res.json({
      success: true,
      page: pageInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/facebook/publish
 * Publica um post
 */
router.post('/publish', async (req, res, next) => {
  try {
    const { message, imagePath, targetPageId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    let result;
    if (imagePath) {
      result = await facebookService.publishPhotoPost(message, imagePath, targetPageId);
    } else {
      result = await facebookService.publishTextPost(message, targetPageId);
    }
    
    res.json({
      success: true,
      post: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
