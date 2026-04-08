const express = require('express')

const {
  deleteStaff,
  getInvoiceSettings,
  getProfileSettings,
  getSmsSettings,
  getStaff,
  getWhatsAppSettings,
  getWhatsAppOnboardingStatus,
  getCourierSettings,
  inviteStaff,
  resetStaffPassword,
  testCourierSettings,
  updateInvoiceSettings,
  updateProfileSettings,
  updateSmsSettings,
  updateStaff,
  updateCourierSettings,
  updateWhatsAppSettings,
} = require('../controllers/settingsController')
const { protect, requireAdmin, requireTenant } = require('../middlewares/authMiddleware')
const { requirePlanFeature } = require('../middlewares/planMiddleware')
const { businessLogoUpload } = require('../utils/cloudinary')

const router = express.Router()

router.use(protect, requireTenant, requireAdmin)

router.route('/profile').get(getProfileSettings).put(businessLogoUpload.single('logo'), updateProfileSettings)
router.route('/invoice').get(getInvoiceSettings).put(updateInvoiceSettings)
router.route('/sms').get(getSmsSettings).put(updateSmsSettings)
router.route('/whatsapp').get(getWhatsAppSettings).put(updateWhatsAppSettings)
router.get('/whatsapp/onboarding', getWhatsAppOnboardingStatus)
router.route('/courier').get(requirePlanFeature('courierSync'), getCourierSettings).put(requirePlanFeature('courierSync'), updateCourierSettings)
router.post('/courier/test', requirePlanFeature('courierSync'), testCourierSettings)
router.route('/team').get(requirePlanFeature('teamManagement'), getStaff).post(requirePlanFeature('teamManagement'), inviteStaff)
router.route('/team/:id').put(requirePlanFeature('teamManagement'), updateStaff).delete(requirePlanFeature('teamManagement'), deleteStaff)
router.patch('/team/:id/reset-password', requirePlanFeature('teamManagement'), resetStaffPassword)

module.exports = router
