/**
 * Success Criteria API Routes
 * Provides endpoints for tracking and monitoring success criteria
 */

import { Router, Request, Response } from 'express';
import { successCriteriaTracker } from '../lib/success-criteria-tracker';

const router = Router();

/**
 * GET /api/success-criteria/summary
 * Get current success criteria summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching success criteria summary...');
    const summary = await successCriteriaTracker.getSuccessCriteriaSummary();
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching success criteria summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch success criteria summary'
    });
  }
});

/**
 * POST /api/success-criteria/track-approval
 * Track approval metrics for win rate calculation
 */
router.post('/track-approval', async (req: Request, res: Response) => {
  try {
    const {
      contentId,
      productSku,
      editorId,
      approvalStatus,
      reviewStartTime,
      reviewEndTime,
      rejectionReason,
      editCount,
      brandVoiceRating
    } = req.body;

    if (!contentId || !productSku || !approvalStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentId, productSku, approvalStatus'
      });
    }

    const reviewDurationMinutes = reviewEndTime && reviewStartTime 
      ? Math.round((new Date(reviewEndTime).getTime() - new Date(reviewStartTime).getTime()) / 60000)
      : undefined;

    await successCriteriaTracker.trackApproval({
      contentId,
      productSku,
      editorId,
      approvalStatus,
      reviewStartTime: new Date(reviewStartTime),
      reviewEndTime: reviewEndTime ? new Date(reviewEndTime) : undefined,
      reviewDurationMinutes,
      rejectionReason,
      editCount,
      brandVoiceRating
    });

    res.json({
      success: true,
      message: 'Approval metric tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking approval metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track approval metric'
    });
  }
});

/**
 * POST /api/success-criteria/track-hallucination
 * Track hallucination detection for accuracy measurement
 */
router.post('/track-hallucination', async (req: Request, res: Response) => {
  try {
    const {
      contentId,
      productSku,
      detectionType,
      confidenceScore,
      description,
      detectedBy,
      humanVerified,
      falsePositive,
      severity
    } = req.body;

    if (!contentId || !productSku || !detectionType || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentId, productSku, detectionType, description'
      });
    }

    await successCriteriaTracker.trackHallucination({
      contentId,
      productSku,
      detectionType,
      confidenceScore: confidenceScore || 0.8,
      description,
      detectedBy: detectedBy || 'automated',
      humanVerified,
      falsePositive,
      severity: severity || 'medium'
    });

    res.json({
      success: true,
      message: 'Hallucination detection tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking hallucination detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track hallucination detection'
    });
  }
});

/**
 * POST /api/success-criteria/track-efficiency
 * Track efficiency metrics for time savings calculation
 */
router.post('/track-efficiency', async (req: Request, res: Response) => {
  try {
    const {
      productSku,
      contentType,
      manualBaselineMinutes,
      aiGenerationSeconds,
      humanReviewMinutes,
      editorId,
      sessionId
    } = req.body;

    if (!productSku || !contentType || !manualBaselineMinutes || !aiGenerationSeconds || !humanReviewMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productSku, contentType, manualBaselineMinutes, aiGenerationSeconds, humanReviewMinutes'
      });
    }

    const totalAiWorkflowMinutes = Math.round(aiGenerationSeconds / 60) + humanReviewMinutes;
    const timeSavingsPercentage = ((manualBaselineMinutes - totalAiWorkflowMinutes) / manualBaselineMinutes) * 100;
    const productivityGain = manualBaselineMinutes / totalAiWorkflowMinutes;

    await successCriteriaTracker.trackEfficiency({
      productSku,
      contentType,
      manualBaselineMinutes,
      aiGenerationSeconds,
      humanReviewMinutes,
      totalAiWorkflowMinutes,
      timeSavingsPercentage: Math.max(0, timeSavingsPercentage),
      productivityGain,
      editorId,
      sessionId
    });

    res.json({
      success: true,
      message: 'Efficiency metric tracked successfully',
      data: {
        timeSavingsPercentage: Math.round(Math.max(0, timeSavingsPercentage)),
        productivityGain: Math.round(productivityGain * 10) / 10
      }
    });
  } catch (error) {
    console.error('Error tracking efficiency metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track efficiency metric'
    });
  }
});

/**
 * POST /api/success-criteria/track-quality
 * Track content quality scores
 */
router.post('/track-quality', async (req: Request, res: Response) => {
  try {
    const {
      contentId,
      productSku,
      overallScore,
      attributeCoverage,
      readabilityScore,
      seoKeywordCoverage,
      brandVoiceConsistency,
      technicalAccuracy,
      emotionalAppeal,
      calculatedBy
    } = req.body;

    if (!contentId || !productSku || overallScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentId, productSku, overallScore'
      });
    }

    await successCriteriaTracker.trackContentQuality({
      contentId,
      productSku,
      overallScore,
      attributeCoverage: attributeCoverage || overallScore,
      readabilityScore: readabilityScore || 8.0,
      seoKeywordCoverage: seoKeywordCoverage || 85,
      brandVoiceConsistency: brandVoiceConsistency || overallScore,
      technicalAccuracy: technicalAccuracy || overallScore,
      emotionalAppeal: emotionalAppeal || overallScore * 0.8,
      calculatedBy: calculatedBy || 'automated'
    });

    res.json({
      success: true,
      message: 'Content quality score tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking content quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track content quality'
    });
  }
});

/**
 * POST /api/success-criteria/simulate-ctr-test
 * Simulate CTR A/B test for demonstration
 */
router.post('/simulate-ctr-test', async (req: Request, res: Response) => {
  try {
    const { productSku, controlContent, variantContent } = req.body;

    if (!productSku || !controlContent || !variantContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productSku, controlContent, variantContent'
      });
    }

    const testId = await successCriteriaTracker.simulateCTRTest(
      productSku,
      controlContent,
      variantContent
    );

    res.json({
      success: true,
      message: 'CTR test simulation created successfully',
      data: { testId }
    });
  } catch (error) {
    console.error('Error simulating CTR test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate CTR test'
    });
  }
});

/**
 * GET /api/success-criteria/alerts
 * Get performance alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const alerts = await successCriteriaTracker.getPerformanceAlerts(limit);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching performance alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance alerts'
    });
  }
});

/**
 * POST /api/success-criteria/alerts/:id/acknowledge
 * Acknowledge performance alert
 */
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id);
    const { acknowledgedBy } = req.body;

    if (!acknowledgedBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: acknowledgedBy'
      });
    }

    await successCriteriaTracker.acknowledgeAlert(alertId, acknowledgedBy);
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

/**
 * GET /api/success-criteria/dashboard
 * Get KPI dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    const dashboardData = await successCriteriaTracker.getKPIDashboardData(startDate, endDate);
    
    res.json({
      success: true,
      data: dashboardData,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * POST /api/success-criteria/calculate-roi
 * Calculate and update ROI metrics
 */
router.post('/calculate-roi', async (req: Request, res: Response) => {
  try {
    const { monthlySKUs, copywriterHourlyRate } = req.body;
    
    const skuCount = monthlySKUs || 100;
    const hourlyRate = copywriterHourlyRate || 45;
    
    await successCriteriaTracker.calculateROI(skuCount, hourlyRate);
    
    res.json({
      success: true,
      message: 'ROI calculation completed successfully',
      data: {
        monthlySKUs: skuCount,
        hourlyRate
      }
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate ROI'
    });
  }
});

/**
 * GET /api/success-criteria/report
 * Generate comprehensive success criteria report
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    console.log('📋 Generating comprehensive success criteria report...');
    const report = await successCriteriaTracker.generateSuccessCriteriaReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating success criteria report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate success criteria report'
    });
  }
});

/**
 * POST /api/success-criteria/demo-data
 * Generate demo data for testing (development only)
 */
router.post('/demo-data', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Demo data generation not allowed in production'
      });
    }

    console.log('🎭 Generating demo data for success criteria testing...');
    
    // Generate sample approval metrics
    const sampleProducts = [
      'B07VGRJDFY', 'B08N5WRWNW', 'F001234567', 'H987654321', 'C555666777',
      'S111222333', 'E444555666', 'D777888999', 'G123456789', 'A999888777'
    ];

    for (let i = 0; i < sampleProducts.length; i++) {
      const sku = sampleProducts[i];
      const contentId = `content_${sku}_${Date.now()}_${i}`;
      
      // Simulate approval (78% win rate)
      const approvalStatus = i === 7 ? 'rejected' : (i === 9 ? 'minor_edits' : 'approved');
      const reviewStartTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const reviewEndTime = new Date(reviewStartTime.getTime() + (10 + Math.random() * 10) * 60 * 1000);
      
      await successCriteriaTracker.trackApproval({
        contentId,
        productSku: sku,
        editorId: 'demo_editor',
        approvalStatus,
        reviewStartTime,
        reviewEndTime,
        reviewDurationMinutes: Math.round((reviewEndTime.getTime() - reviewStartTime.getTime()) / 60000),
        rejectionReason: approvalStatus === 'rejected' ? 'Lacks emotional appeal and lifestyle context' : undefined,
        editCount: approvalStatus === 'minor_edits' ? 3 : 0,
        brandVoiceRating: 4 + Math.random()
      });

      // Simulate efficiency metrics (65% time savings)
      const manualTime = 30 + Math.random() * 30; // 30-60 minutes
      const aiTime = Math.round(manualTime * 0.35); // 35% of manual time
      const reviewTime = 8 + Math.random() * 7; // 8-15 minutes
      
      await successCriteriaTracker.trackEfficiency({
        productSku: sku,
        contentType: 'description',
        manualBaselineMinutes: Math.round(manualTime),
        aiGenerationSeconds: Math.round(Math.random() * 30 + 10), // 10-40 seconds
        humanReviewMinutes: Math.round(reviewTime),
        totalAiWorkflowMinutes: Math.round(aiTime),
        timeSavingsPercentage: Math.round(((manualTime - aiTime) / manualTime) * 100),
        productivityGain: manualTime / aiTime,
        editorId: 'demo_editor',
        sessionId: `session_${i}`
      });

      // Simulate quality scores
      const baseScore = 3.8 + Math.random() * 1.2; // 3.8-5.0
      await successCriteriaTracker.trackContentQuality({
        contentId,
        productSku: sku,
        overallScore: Math.round(baseScore * 10) / 10,
        attributeCoverage: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
        readabilityScore: Math.round((7.5 + Math.random() * 1.5) * 10) / 10,
        seoKeywordCoverage: Math.round(80 + Math.random() * 15),
        brandVoiceConsistency: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
        technicalAccuracy: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
        emotionalAppeal: Math.round((3.5 + Math.random() * 1.0) * 10) / 10,
        calculatedBy: 'automated'
      });

      // Simulate occasional hallucinations (3% rate)
      if (Math.random() < 0.03) {
        await successCriteriaTracker.trackHallucination({
          contentId,
          productSku: sku,
          detectionType: 'incorrect_fact',
          confidenceScore: 0.85,
          description: 'Incorrect storage capacity mentioned in description',
          detectedBy: 'automated',
          humanVerified: true,
          falsePositive: false,
          severity: 'medium'
        });
      }

      // Simulate CTR tests
      if (i < 5) {
        await successCriteriaTracker.simulateCTRTest(
          sku,
          `Original description for ${sku}`,
          `AI-generated optimized description for ${sku}`
        );
      }
    }

    // Calculate ROI
    await successCriteriaTracker.calculateROI(100, 45);

    res.json({
      success: true,
      message: 'Demo data generated successfully',
      data: {
        productsGenerated: sampleProducts.length,
        metricsTracked: ['approval', 'efficiency', 'quality', 'hallucination', 'ctr']
      }
    });
  } catch (error) {
    console.error('Error generating demo data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo data'
    });
  }
});

export default router;