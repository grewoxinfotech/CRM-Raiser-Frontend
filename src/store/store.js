import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../auth/services/authSlice";
import { authApi } from "../auth/services/authApi";
import { companyApi } from "../superadmin/module/company/services/companyApi.js";
import { superadminProfileApi } from "../superadmin/module/profile/services/superadminProfileApi.js";
import superadminProfileReducer from "../superadmin/module/profile/services/superadminProfileSlice.js";
import { settingsApi } from "../superadmin/module/settings/services/settingsApi.js";
import { planApi } from "../superadmin/module/plans/services/planApi.js";
import { policyApi } from "../superadmin/module/policy/service/policyApi.js";
import { notesApi } from "../superadmin/module/notes/services/NotesApi.js";
import { inquiryApi } from "../superadmin/module/inquary/services/inquaryApi.js";
// import { dealInvoiceApi } from "../dashboard/module/crm/deal/overview/invoices/services/dealinvoiceApi.js";
import { subclientApi } from "../dashboard/module/user-management/subclient/services/subClientApi.js";
import { roleApi } from "../dashboard/module/hrm/role/services/roleApi.js";
import { userApi } from "../dashboard/module/user-management/users/services/userApi.js";
import { employeeApi } from "../dashboard/module/hrm/Employee/services/employeeApi.js";
import { designationApi } from "../dashboard/module/hrm/Designation/services/designationApi.js";
import { branchApi } from "../dashboard/module/hrm/Branch/services/branchApi.js";
import { departmentApi } from "../dashboard/module/hrm/Department/services/departmentApi.js";
import { trainingApi } from "../dashboard/module/hrm/Training/services/trainingApi.js";
import { esignatureApi } from "../superadmin/module/settings/eSignature/services/esignatureApi.js";
import { pipelineApi } from "../dashboard/module/crm/crmsystem/pipeline/services/pipelineApi.js";
import { leadStageApi } from "../dashboard/module/crm/crmsystem/leadstage/services/leadStageApi.js";
import { dealStageApi } from "../dashboard/module/crm/crmsystem/dealstage/services/dealStageApi.js";
import { sourceApi } from "../dashboard/module/crm/crmsystem/souce/services/SourceApi.js";
import { taskApi } from "../dashboard/module/crm/task/services/taskApi.js";
import { projectApi } from "../dashboard/module/crm/project/services/projectApi.js";
import { jobApi } from "../dashboard/module/job/jobs/services/jobApi.js";
import { jobApplicationApi } from "../dashboard/module/job/job applications/services/jobApplicationApi.js";
import { jobOnboardingApi } from "../dashboard/module/job/job onboarding/services/jobOnboardingApi.js";
import { offerLetterApi } from "../dashboard/module/job/offer letters/services/offerLetterApi.js";
import { interviewApi } from "../dashboard/module/job/interviews/services/interviewApi.js";
import { documentApi } from "../dashboard/module/hrm/Document/services/documentApi";
import { leadApi } from "../dashboard/module/crm/lead/services/LeadApi.js";
import { dealApi } from "../dashboard/module/crm/deal/services/DealApi.js";
import { creditNoteApi } from "../dashboard/module/sales/creditnotes/services/creditNoteApi.js";
import { customerApi } from "../dashboard/module/sales/customer/services/custApi.js";
import { invoiceApi } from "../dashboard/module/sales/invoice/services/invoiceApi.js";
import { revenueApi } from "../dashboard/module/sales/revenue/services/revenueApi.js";
import { productApi } from "../dashboard/module/sales/product&services/services/productApi.js";
import { leaveApi } from "../dashboard/module/hrm/leave/services/leaveApi.js";
import { dealPaymentApi } from "../dashboard/module/crm/deal/overview/payments/services/dealpaymentApi.js";
import { subscribedUserApi } from "../superadmin/module/SubscribedUser/services/SubscribedUserApi.js";
import { ticketApi } from "../dashboard/module/support/ticket/services/ticketApi.js";
import { calendarApi } from "../dashboard/module/communication/calendar/services/calendarApi.js";
import { taskCalendarApi } from "../dashboard/module/crm/taskcalendar/services/taskCalender.js";
import { proposalApi } from "../dashboard/module/crm/proposal/services/proposalApi.js";
import { taxApi } from "../dashboard/module/settings/tax/services/taxApi.js";
import { salaryApi } from "../dashboard/module/hrm/payRoll/services/salaryApi.js";
import { attendanceApi } from "../dashboard/module/hrm/Attendance/services/attendanceApi";
import { holidayApi } from "../dashboard/module/hrm/Holiday/services/holidayApi";
import { vendorApi } from "../dashboard/module/purchase/vendor/services/vendorApi.js";
import { billingApi } from "../dashboard/module/purchase/billing/services/billingApi";
import { debitNoteApi } from "../dashboard/module/purchase/debitnote/services/debitnoteApi";
import leadStageReducer from "../dashboard/module/crm/crmsystem/leadstage/services/leadStageSlice";
import { meetingApi } from "../dashboard/module/hrm/Meeting/services/meetingApi";
import { announcementApi } from "../dashboard/module/hrm/Announcement/services/announcementApi";
import { mailApi } from "../dashboard/module/communication/mail/services/mailApi";
import { notificationApi } from "../common/notifacations/services/notificationApi";
import { companyAccountApi } from "../dashboard/module/crm/companyacoount/services/companyAccountApi";
import { contactApi } from "../dashboard/module/crm/contact/services/contactApi";
import { companyInquiryApi } from "../dashboard/module/crm/company-inquiry/services/companyInquiryApi";
import { customFormApi } from "../dashboard/module/crm/generate-link/services/customFormApi";
import { settingApi } from "../superadmin/module/settings/general/services/settingApi";
import { activityApi } from "../dashboard/module/crm/lead/overview/activity/services/activityApi";
import { followupTaskApi } from "../dashboard/module/crm/deal/overview/followup/task/services/followupTaskApi";
import { followupMeetingApi } from "../dashboard/module/crm/deal/overview/followup/metting/services/followupMettingApi";
import { followupCallApi } from "../dashboard/module/crm/deal/overview/followup/call/services/followupCallApi";
import { forgotPasswordApi } from "../auth/forgot-password/services/forgot-passwordApi";
import dealStageReducer from "../dashboard/module/crm/deal/services/DealStageSlice";
import { storageApi } from "../superadmin/module/storage/services/storageApi";
import { paymentGatewayApi } from "../superadmin/module/settings/payment-gateway/services/paymentGatewayApi";
import { RESET_STATE, RESET_API_STATE } from './actions';

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "leadStage", "dealStage"],
  // Add transforms to handle serialization issues
  transforms: [
    {
      in: (state) => {
        // Ensure state is properly serialized before storing
        try {
          return JSON.parse(JSON.stringify(state));
        } catch (error) {
          console.error('Error serializing state:', error);
          return state;
        }
      },
      out: (state) => {
        // Ensure state is properly deserialized when retrieving
        return state;
      }
    }
  ],
};

const rootReducer = (state, action) => {
  if (action.type === RESET_STATE) {
    // Keep only auth state when resetting
    const { auth } = state;
    state = { auth };
  } else if (action.type === RESET_API_STATE) {
    // Reset all API states except auth
    const apiKeys = Object.keys(state).filter(key =>
      key.endsWith('Api') && key !== 'authApi'
    );
    apiKeys.forEach(key => {
      if (state[key]) {
        state[key] = {
          ...state[key],
          queries: {},
          mutations: {},
          provided: {},
          subscriptions: {},
        };
      }
    });
  }
  return combineReducers({
    auth: authReducer,
    superadminProfile: superadminProfileReducer,
    leadStage: leadStageReducer,
    dealStage: dealStageReducer,
    [authApi.reducerPath]: authApi.reducer,
    [documentApi.reducerPath]: documentApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [superadminProfileApi.reducerPath]: superadminProfileApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [planApi.reducerPath]: planApi.reducer,
    [policyApi.reducerPath]: policyApi.reducer,
    // [dealInvoiceApi.reducerPath]: dealInvoiceApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [inquiryApi.reducerPath]: inquiryApi.reducer,
    [subclientApi.reducerPath]: subclientApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [designationApi.reducerPath]: designationApi.reducer,
    [branchApi.reducerPath]: branchApi.reducer,
    [departmentApi.reducerPath]: departmentApi.reducer,
    [esignatureApi.reducerPath]: esignatureApi.reducer,
    [trainingApi.reducerPath]: trainingApi.reducer,
    [pipelineApi.reducerPath]: pipelineApi.reducer,
    [dealPaymentApi.reducerPath]: dealPaymentApi.reducer,
    [leadStageApi.reducerPath]: leadStageApi.reducer,
    [dealStageApi.reducerPath]: dealStageApi.reducer,
    [sourceApi.reducerPath]: sourceApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [jobApi.reducerPath]: jobApi.reducer,
    [jobApplicationApi.reducerPath]: jobApplicationApi.reducer,
    [jobOnboardingApi.reducerPath]: jobOnboardingApi.reducer,
    [offerLetterApi.reducerPath]: offerLetterApi.reducer,
    [interviewApi.reducerPath]: interviewApi.reducer,
    [leadApi.reducerPath]: leadApi.reducer,
    [dealApi.reducerPath]: dealApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [creditNoteApi.reducerPath]: creditNoteApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [revenueApi.reducerPath]: revenueApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [subscribedUserApi.reducerPath]: subscribedUserApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
    [taskCalendarApi.reducerPath]: taskCalendarApi.reducer,
    [proposalApi.reducerPath]: proposalApi.reducer,
    [taxApi.reducerPath]: taxApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [holidayApi.reducerPath]: holidayApi.reducer,
    [salaryApi.reducerPath]: salaryApi.reducer,
    // [dealInvoiceApi.reducerPath]: dealInvoiceApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [debitNoteApi.reducerPath]: debitNoteApi.reducer,
    [meetingApi.reducerPath]: meetingApi.reducer,
    [announcementApi.reducerPath]: announcementApi.reducer,
    [mailApi.reducerPath]: mailApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [companyAccountApi.reducerPath]: companyAccountApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [companyInquiryApi.reducerPath]: companyInquiryApi.reducer,
    [customFormApi.reducerPath]: customFormApi.reducer,
    [followupTaskApi.reducerPath]: followupTaskApi.reducer,
    [followupMeetingApi.reducerPath]: followupMeetingApi.reducer,
    [followupCallApi.reducerPath]: followupCallApi.reducer,
    [settingApi.reducerPath]: settingApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [forgotPasswordApi.reducerPath]: forgotPasswordApi.reducer,
    [storageApi.reducerPath]: storageApi.reducer,
    [paymentGatewayApi.reducerPath]: paymentGatewayApi.reducer,
  })(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          RESET_STATE,
          RESET_API_STATE
        ],
      },
    })
      .concat(authApi.middleware)
      .concat(documentApi.middleware)
      .concat(companyApi.middleware)
      .concat(superadminProfileApi.middleware)
      .concat(settingsApi.middleware)
      .concat(planApi.middleware)
      .concat(policyApi.middleware)
      .concat(notesApi.middleware)
      .concat(inquiryApi.middleware)
      .concat(esignatureApi.middleware)
      .concat(subclientApi.middleware)
      .concat(roleApi.middleware)
      .concat(userApi.middleware)
      .concat(employeeApi.middleware)
      .concat(designationApi.middleware)
      .concat(branchApi.middleware)
      .concat(departmentApi.middleware)
      .concat(trainingApi.middleware)
      .concat(pipelineApi.middleware)
      .concat(dealPaymentApi.middleware)
      .concat(leadStageApi.middleware)
      .concat(dealStageApi.middleware)
      .concat(sourceApi.middleware)
      .concat(taskApi.middleware)
      .concat(projectApi.middleware)
      .concat(jobApi.middleware)
      .concat(jobApplicationApi.middleware)
      .concat(jobOnboardingApi.middleware)
      .concat(offerLetterApi.middleware)
      .concat(interviewApi.middleware)
      .concat(leadApi.middleware)
      .concat(dealApi.middleware)
      .concat(customerApi.middleware)
      .concat(creditNoteApi.middleware)
      .concat(invoiceApi.middleware)
      .concat(revenueApi.middleware)
      .concat(productApi.middleware)
      .concat(leaveApi.middleware)
      .concat(subscribedUserApi.middleware)
      .concat(ticketApi.middleware)
      .concat(calendarApi.middleware)
      .concat(taskCalendarApi.middleware)
      .concat(proposalApi.middleware)
      .concat(taxApi.middleware)
      .concat(attendanceApi.middleware)
      .concat(holidayApi.middleware)
      .concat(salaryApi.middleware)
      // .concat(dealInvoiceApi.middleware)
      .concat(vendorApi.middleware)
      .concat(billingApi.middleware)
      .concat(debitNoteApi.middleware)
      .concat(meetingApi.middleware)
      .concat(announcementApi.middleware)
      .concat(mailApi.middleware)
      .concat(notificationApi.middleware)
      .concat(companyAccountApi.middleware)
      .concat(contactApi.middleware)
      .concat(companyInquiryApi.middleware)
      .concat(customFormApi.middleware)
      .concat(followupTaskApi.middleware)
      .concat(followupMeetingApi.middleware)
      .concat(followupCallApi.middleware)
      .concat(settingApi.middleware)
      .concat(activityApi.middleware)
      .concat(forgotPasswordApi.middleware)
      .concat(storageApi.middleware)
      .concat(paymentGatewayApi.middleware),
});

export const persistor = persistStore(store);

export default store;
