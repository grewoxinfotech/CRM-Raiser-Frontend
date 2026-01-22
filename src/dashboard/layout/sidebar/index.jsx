import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../../auth/services/authSlice';
import { useGetsubcriptionByIdQuery } from '../../../superadmin/module/SubscribedUser/services/SubscribedUserApi';
import moment from 'moment';
import {
  FiHome,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiFolder,
  FiDollarSign,
  FiShoppingBag,
  FiShoppingCart,
  FiTarget,
  FiFileText,
  FiCalendar,
  FiMail,
  FiMessageSquare,
  FiUser,
  FiHelpCircle,
  FiGrid,
  FiCheckSquare,
  FiBriefcase,
  FiTrendingUp,
  FiUserCheck,
  FiShield,
  FiMapPin,
  FiTag,
  FiClock,
  FiVideo,
  FiBell,
  FiFile,
  FiEdit3,
  FiBookOpen,
  FiPackage,
  FiGlobe,
  FiPercent,
  FiCreditCard,
  FiTruck,
  FiSliders,
  FiMenu,
} from "react-icons/fi";
import "./sidebar.scss";
import { useLogout } from "../../../hooks/useLogout";
import BrandConfig from "../../../utils/brandName";

const Sidebar = ({
  collapsed = false,
  onCollapsedChange = () => { },
  rolesData,
  loggedInUser,
  isMobileMenuOpen = false,
  onMobileMenuClose = () => { }
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommunicationOpen, setCommunicationOpen] = useState(false);
  const [isCrmOpen, setCrmOpen] = useState(false);
  const [isUserManagementOpen, setUserManagementOpen] = useState(false);
  const [isHrmOpen, setHrmOpen] = useState(false);
  const [isSupportOpen, setSupportOpen] = useState(false);
  const [isJobOpen, setJobOpen] = useState(false);
  const [isSalesOpen, setSalesOpen] = useState(false);
  const [isPurchaseOpen, setPurchaseOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [localMobileMenuOpen, setLocalMobileMenuOpen] = useState(isMobileMenuOpen);
  const floatingDropdownRef = useRef(null);

  const handleLogout = useLogout();

  const userRole = useSelector(selectUserRole);

  // Check if super-admin logged into company account
  const isSuperAdminCompanyLogin = localStorage.getItem('isSuperAdminCompanyLogin') === 'true';
  
  // Fetch subscription data to check expiry
  const subscriptionId = loggedInUser?.client_plan_id;
  // Don't check subscription for: super-admin OR super-admin logged into company
  const shouldFetchSubscription = subscriptionId && userRole !== 'super-admin' && !isSuperAdminCompanyLogin;
  
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useGetsubcriptionByIdQuery(subscriptionId, {
    skip: !shouldFetchSubscription // Don't fetch for super-admin or if no subscription ID
  });

  // Check if subscription is expired
  const isSubscriptionExpired = React.useMemo(() => {
    if (userRole === 'super-admin') return false; // Super admin never expires
    if (isSuperAdminCompanyLogin) return false; // Super admin in company account never expires
    if (!subscriptionData?.data?.end_date) return false;
    
    const endDate = moment(subscriptionData.data.end_date);
    const currentDate = moment();
    return endDate.isBefore(currentDate); // Returns true if expired
  }, [subscriptionData, userRole, isSuperAdminCompanyLogin]);

  // Show loading state while checking subscription
  // Ready when: super-admin OR super-admin company login OR no subscription needed OR subscription loaded
  const isSidebarReady = userRole === 'super-admin' || isSuperAdminCompanyLogin || !shouldFetchSubscription || !isSubscriptionLoading;

  // Find user's role data if not client
  const userRoleData = userRole?.toLowerCase() !== 'client' ?
    rolesData?.message?.data?.find(role => role.id === loggedInUser?.role_id) : null;

  // Parse permissions if they exist - handle both string and object formats
  const userPermissions = React.useMemo(() => {
    if (!userRoleData?.permissions) return null;
    
    try {
      // If it's already an object, return it directly
      if (typeof userRoleData.permissions === 'object') {
        return userRoleData.permissions;
      }
      // If it's a string, try to parse it
      return JSON.parse(userRoleData.permissions);
    } catch (error) {
      console.error('Error parsing permissions in sidebar:', error);
      return null;
    }
  }, [userRoleData]);


  const checkPermission = (moduleKey) => {
    // Always allow settings, communication and support modules
    const alwaysAllowedModules = ['settings', 'communication', 'support'];
    if (alwaysAllowedModules.includes(moduleKey?.toLowerCase())) {
      return true;
    }

    // If user is client, show everything
    if (userRole?.toLowerCase() === 'client') {
      return true;
    }

    // For other roles, check specific permissions
    if (!userPermissions) return false;

    // Check if the permission exists and has at least view access
    const modulePermissions = userPermissions[moduleKey];
    if (modulePermissions && modulePermissions.length > 0) {
      return modulePermissions[0].permissions.includes('view');
    }

    return false;
  };

  const shouldShowMenuItem = (item) => {
    // If subscription expired, only show Dashboard and Settings
    if (isSubscriptionExpired) {
      // Allow Dashboard
      if (item.title === 'Dashboard') {
        return true;
      }
      // Allow Settings but only Plan submenu
      if (item.title === 'Setting') {
        return true;
      }
      // Hide all other menu items
      return false;
    }

    // Normal flow when subscription is active
    // Always show Settings, Communication and Support
    const alwaysShowItems = ['Setting', 'Communication', 'Support'];
    if (alwaysShowItems.includes(item.title)) {
      return true;
    }

    // If role is client, show everything
    if (userRole?.toLowerCase() === 'client') {
      return true;
    }

    if (!item.permission) return true;

    if (item.subItems?.length > 0) {
      // If it's an always shown item, show all its subitems
      if (alwaysShowItems.includes(item.title)) {
        return true;
      }
      // Show if any child has permission
      return item.subItems.some(subItem =>
        !subItem.permission || checkPermission(subItem.permission)
      );
    }

    return checkPermission(item.permission);
  };

  // Handle window resize and mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobileView(mobile);
      if (mobile) {
        setIsCollapsed(false); // Never collapse on mobile
      } else {
        setIsCollapsed(collapsed);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [collapsed]);

  // Handle toggle collapse - only work on desktop
  const handleToggleCollapse = () => {
    if (!isMobileView) {
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      onCollapsedChange(newCollapsedState);
    }
  };

  // Sync mobile menu state with props
  useEffect(() => {
    setLocalMobileMenuOpen(isMobileMenuOpen);
    if (isMobileMenuOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [isMobileMenuOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingDropdownRef.current &&
        !floatingDropdownRef.current.contains(event.target) &&
        !event.target.closest('.nav-item.dropdown-trigger')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleFloatingDropdownClose = (e) => {
    // If clicking inside a dropdown menu, don't close the sidebar
    if (e && (e.target.closest('.dropdown-menu') || e.target.closest('.nav-item'))) {
      return;
    }
    setOpenDropdown(null);
  };

  // Modify dropdown click handler
  const handleDropdownClick = (e, dropdownName) => {
    e.stopPropagation(); // Prevent event from bubbling up

    // Update the corresponding state based on dropdown name
    switch (dropdownName) {
      case "CRM":
        setCrmOpen(!isCrmOpen);
        break;
      case "Sales":
        setSalesOpen(!isSalesOpen);
        break;
      case "Purchase":
        setPurchaseOpen(!isPurchaseOpen);
        break;
      case "User Management":
        setUserManagementOpen(!isUserManagementOpen);
        break;
      case "Communication":
        setCommunicationOpen(!isCommunicationOpen);
        break;
      case "HRM":
        setHrmOpen(!isHrmOpen);
        break;
      case "Setting":
        setIsSettingsOpen(!isSettingsOpen);
        break;
      case "Support":
        setSupportOpen(!isSupportOpen);
        break;
      case "Job":
        setJobOpen(!isJobOpen);
        break;
    }

    // Handle collapsed state dropdown
    if (isCollapsed) {
      if (openDropdown === dropdownName) {
        setOpenDropdown(null);
      } else {
        setOpenDropdown(dropdownName);
      }
    }
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    const newState = !localMobileMenuOpen;
    setLocalMobileMenuOpen(newState);
    onMobileMenuClose();
    if (newState) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
      setLocalMobileMenuOpen(false);
      onMobileMenuClose();
      document.body.classList.remove('sidebar-open');
    }
  };

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, []);

  // Handle navigation and close mobile menu
  const handleNavigation = () => {
    if (localMobileMenuOpen) {
      setLocalMobileMenuOpen(false);
      onMobileMenuClose();
      document.body.classList.remove('sidebar-open');
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <FiHome />,
      path: "/dashboard",
    },
    {
      title: "CRM",
      icon: <FiUsers />,
      isDropdown: true,
      permission: 'dashboards-crm',
      subItems: [
        {
          title: "Leads",
          icon: <FiTarget />,
          path: "/dashboard/crm/leads",
          permission: "dashboards-lead"
        },
        {
          title: "Deals",
          icon: <FiShoppingBag />,
          path: "/dashboard/crm/deals",
          permission: "dashboards-deal"
        },
        // {
        //   title: "Project",
        //   icon: <FiFolder />,
        //   path: "/dashboard/crm/project",
        //   permission: "dashboards-project-list"
        // },
        {
          title: "Company",
          icon: <FiBriefcase />,
          path: "/dashboard/crm/company-account",
          permission: "dashboards-crm-company-account"
        },
        {
          title: "Contact",
          icon: <FiFileText />,
          path: "/dashboard/crm/contact",
          permission: "dashboards-crm-contact"
        },
        {
          title: "Custom Form",
          icon: <FiFileText />,
          path: "/dashboard/crm/custom-form",
          permission: "dashboards-custom-form"
        },
        // {
        //   title: "Inquiry",
        //   icon: <FiMessageSquare />,
        //   path: "/dashboard/crm/company-inquiry",
        //   permission: "dashboards-inquiry"
        // },
        // {
        //   title: "Proposal",
        //   icon: <FiFileText />,
        //   path: "/dashboard/crm/proposal",
        //   permission: "dashboards-proposal"
        // },
        {
          title: "Task",
          icon: <FiCheckSquare />,
          path: "/dashboard/crm/tasks",
          permission: "dashboards-task"
        },
        {
          title: "Task Calendar",
          icon: <FiCalendar />,
          path: "/dashboard/crm/task-calendar",
          permission: "dashboards-TaskCalendar"
        },
        {
          title: "CRM System Setup",
          icon: <FiSettings />,
          path: "/dashboard/crm-setup",
          permission: "dashboards-systemsetup"
        }
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "Sales",
      icon: <FiShoppingCart />,
      isDropdown: true,
      permission: 'dashboards-sales',
      subItems: [
        {
          title: "Product & Services",
          icon: <FiPackage />,
          path: "/dashboard/sales/product-services",
          permission: "dashboards-sales-product-services"
        },
        {
          title: "Customer",
          icon: <FiUsers />,
          path: "/dashboard/sales/customer",
          permission: "dashboards-sales-customer"
        },

        {
          title: "Invoice",
          icon: <FiFileText />,
          path: "/dashboard/sales/invoice",
          permission: "dashboards-sales-invoice"
        },
       
        {
          title: "Credit Notes",
          icon: <FiFile />,
          path: "/dashboard/sales/credit-notes",
          permission: "dashboards-sales-credit-notes"
        },
        {
          title: "Revenue",
          icon: <FiTrendingUp />,
          path: "/dashboard/sales/revenue",
          permission: "dashboards-sales-revenue"
        },
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "Purchase",
      icon: <FiShoppingBag />,
      isDropdown: true,
      permission: 'dashboards-purchase',
      subItems: [
        {
          title: "Vendor",
          icon: <FiTruck />,
          path: "/dashboard/purchase/vendor",
          permission: "dashboards-purchase-vendor"
        },
        {
          title: "Billing",
          icon: <FiCreditCard />,
          path: "/dashboard/purchase/billing",
          permission: "dashboards-purchase-billing"
        },
        {
          title: "Debit Note",
          icon: <FiFileText />,
          path: "/dashboard/purchase/debit-note",
          permission: "dashboards-purchase-debit-note"
        }
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "User Management",
      icon: <FiUsers />,
      isDropdown: true,
      permission: 'extra-users',
      subItems: [
        {
          title: "Users",
          icon: <FiUser />,
          path: "/dashboard/user-management/users",
          permission: "extra-users-list"
        },
        // {
        //   title: "Clients",
        //   icon: <FiBriefcase />,
        //   path: "/dashboard/clients",
        //   permission: "extra-users-client-list"
        // }
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "Communication",
      icon: <FiMessageSquare />,
      isDropdown: true,
      subItems: [
        {
          title: "Mail",
          icon: <FiMail />,
          path: "/dashboard/communication/mail",
          permission: "dashboards-communication"
        },
        {
          title: "Chat",
          icon: <FiMessageSquare />,
          path: "/dashboard/communication/chat",
          permission: "dashboards-communication"
        },

      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "HRM",
      icon: <FiUsers />,
      isDropdown: true,
      permission: 'extra-hrm',
      subItems: [
        {
          title: "Employee",
          icon: <FiUsers />,
          path: "/dashboard/hrm/employee",
          permission: "extra-hrm-employee"
        },
        {
          title: "PayRoll",
          icon: <FiDollarSign />,
          path: "/dashboard/hrm/payroll",
          permission: "extra-hrm-payroll"
        },
        {
          title: "Role",
          icon: <FiShield />,
          path: "/dashboard/hrm/role",
          permission: "extra-hrm-role"
        },
        {
          title: "Branch",
          icon: <FiMapPin />,
          path: "/dashboard/hrm/branch",
          permission: "extra-hrm-branch"
        },
        {
          title: "Designation",
          icon: <FiTag />,
          path: "/dashboard/hrm/designation",
          permission: "extra-hrm-designation"
        },
        {
          title: "Department",
          icon: <FiGrid />,
          path: "/dashboard/hrm/department",
          permission: "extra-hrm-department"
        },
        {
          title: "Attendance",
          icon: <FiClock />,
          path: "/dashboard/hrm/attendance",
          permission: "extra-hrm-attendance-attendancelist"
        },
        {
          title: "Holiday",
          icon: <FiCalendar />,
          path: "/dashboard/hrm/holiday",
          permission: "extra-hrm-holiday"
        },
        {
          title: "Leave Management",
          icon: <FiCalendar />,
          path: "/dashboard/hrm/leave",
          permission: "extra-hrm-leave-leavelist"
        },
        {
          title: "Calendar",
          icon: <FiCalendar />,
          path: "/dashboard/hrm/calendar",
          permission: "extra-hrm-calendar"
        },
        {
          title: "Meeting",
          icon: <FiVideo />,
          path: "/dashboard/hrm/meeting",
          permission: "extra-hrm-meeting"
        },
        {
          title: "Announcement",
          icon: <FiBell />,
          path: "/dashboard/hrm/announcement",
          permission: "extra-hrm-announcement"
        },
        {
          title: "Document",
          icon: <FiFile />,
          path: "/dashboard/hrm/document",
          permission: "extra-hrm-document"
        },
        {
          title: "Training Setup",
          icon: <FiBookOpen />,
          path: "/dashboard/hrm/training",
          permission: "extra-hrm-trainingSetup"
        },
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: "Job",
      icon: <FiBriefcase />,
      isDropdown: true,
      permission: "extra-hrm-jobs-joblist",
      subItems: [
        {
          title: "Jobs",
          icon: <FiBriefcase />,
          path: "/dashboard/job/jobs",
          permission: "extra-hrm-jobs-joblist"
        },
        {
          title: "Job Candidates",
          icon: <FiUsers />,
          path: "/dashboard/job/job-candidates",
          permission: "extra-hrm-jobs-jobcandidate"
        },
        {
          title: "Job On-Boarding",
          icon: <FiUserCheck />,
          path: "/dashboard/job/job-onboarding",
          permission: "extra-hrm-jobs-jobonbording"
        },
        {
          title: "Job Applications",
          icon: <FiFileText />,
          path: "/dashboard/job/job-applications",
          permission: "extra-hrm-jobs-jobapplication"
        },
        {
          title: "Offer Letters",
          icon: <FiFile />,
          path: "/dashboard/job/offer-letters",
          permission: "extra-hrm-jobs-jobofferletter"
        },
        {
          title: "Interviews",
          icon: <FiCalendar />,
          path: "/dashboard/job/interviews",
          permission: "extra-hrm-jobs-interview"
        },
      ].filter(item => shouldShowMenuItem(item)),
    },
    {
      title: 'Setting',
      icon: <FiSettings />,
      isDropdown: true,
      subItems: [
        {
          title: 'General',
          icon: <FiSliders />,
          path: '/dashboard/settings/general',
          permission: "dashboards-communication"
        },
        {
          title:'Plan',
          icon:< FiBookOpen/>,
          path:'/dashboard/settings/plan',
          permission:"dashboards-communication"
        },
        {
          title: 'Payment',
          icon: <FiDollarSign />,
          path: '/dashboard/settings/payment',
          permission: "dashboards-communication"
        },
        {
          title: 'Countries',
          icon: <FiGlobe />,
          path: '/dashboard/settings/countries',
          permission: "dashboards-communication"
        },
        {
          title: 'Currencies',
          icon: <FiCreditCard />,
          path: '/dashboard/settings/currencies',
          permission: "dashboards-communication"
        },
        {
          title: 'Tax',
          icon: <FiPercent />,
          path: '/dashboard/settings/tax',
          permission: "dashboards-communication"
        },
        {
          title: 'ESignature',
          icon: <FiEdit3 />,
          path: '/dashboard/settings/esignature',
          permission: "dashboards-communication"
        }
      ].filter(subItem => {
        // If subscription expired, only show Plan
        if (isSubscriptionExpired) {
          return subItem.title === 'Plan';
        }
        // Otherwise show all items based on permission
        return shouldShowMenuItem(subItem);
      })
    },
    {
      title: "Support",
      icon: <FiHelpCircle />,
      isDropdown: true,
      subItems: [
        {
          title: "Ticket",
          icon: <FiMessageSquare />,
          path: "/dashboard/support/ticket",
          permission: "dashboards-communication"
        },
      ],
    },
  ].filter(item => shouldShowMenuItem(item));

  const renderNavItem = (item) => (
    <NavLink
      to={item.path}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <div className="nav-item-content">
        <span className="icon">{item.icon}</span>
        {!isCollapsed && <span className="title">{item.title}</span>}
      </div>
    </NavLink>
  );

  const renderDropdown = (item, isOpen, setIsOpen) => {
    const isSubItemActive = item.subItems.some(subItem => {
      const currentPath = window.location.pathname;
      return currentPath === subItem.path;
    });

    return (
      <div className={`nav-dropdown ${isOpen ? 'open' : ''}`}>
        <div
          className={`nav-item dropdown-trigger ${isOpen || isSubItemActive ? 'active' : ''}`}
          onClick={(e) => handleDropdownClick(e, item.title)}
        >
          <div className="nav-item-content">
            <span className="icon">
              {item.icon}
            </span>
            {!isCollapsed && (
              <>
                <span className="title">{item.title}</span>
                <FiChevronRight className="arrow" />
              </>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <motion.div
            className="dropdown-menu"
            initial={false}
            animate={
              isOpen
                ? {
                  opacity: 1,
                  height: "auto",
                  marginTop: "4px",
                  marginBottom: "4px",
                  y: 0,
                }
                : {
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  y: -5,
                }
            }
            transition={{
              height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25, ease: "easeInOut" },
            }}
          >
            {item.subItems.map((subItem, index) => (
              <NavLink
                key={subItem.path || `${item.title}-${index}`}
                to={subItem.path}
                className={({ isActive }) =>
                  `nav-item sub-item ${isActive ? "active" : ""}`
                }
                onClick={handleNavigation}
              >
                <div className="nav-item-content">
                  <span className="icon">{subItem.icon}</span>
                  <span className="title">{subItem.title}</span>
                </div>
              </NavLink>
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <>
      <button className="mobile-menu-toggle" onClick={handleMobileMenuToggle}>
        <FiMenu />
      </button>

      {localMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={handleOverlayClick} />
      )}

      <aside className={`sidebar ${!isMobileView && isCollapsed ? 'collapsed' : ''} ${localMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {(!isMobileView && !isCollapsed) && <span className="full-text">{BrandConfig.appCapitalName} CRM</span>}
            {isMobileView && <span className="full-text">{BrandConfig.appCapitalName} CRM</span>}
          </div>
          {!isMobileView ? (
            <button className="collapse-btn" onClick={handleToggleCollapse}>
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          ) : (
            <button className="mobile-close-btn" onClick={handleMobileMenuToggle}>
              <FiChevronLeft />
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {!isSidebarReady ? (
            // Show loading skeleton while checking subscription
            <div style={{ padding: '20px', opacity: 0.5 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  style={{
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
              ))}
            </div>
          ) : (
            menuItems.map((item, index) => (
              <motion.div key={item.path || index} initial={false} onClick={handleNavigation}>
                {!item.isDropdown
                  ? renderNavItem(item)
                  : item.title === "CRM"
                    ? renderDropdown(item, isCrmOpen, setCrmOpen)
                    : item.title === "Sales"
                      ? renderDropdown(item, isSalesOpen, setSalesOpen)
                      : item.title === "Purchase"
                        ? renderDropdown(item, isPurchaseOpen, setPurchaseOpen)
                        : item.title === "User Management"
                          ? renderDropdown(
                            item,
                            isUserManagementOpen,
                            setUserManagementOpen
                          )
                          : item.title === "Communication"
                            ? renderDropdown(item, isCommunicationOpen, setCommunicationOpen)
                            : item.title === "HRM"
                              ? renderDropdown(item, isHrmOpen, setHrmOpen)
                              : item.title === "Setting"
                                ? renderDropdown(item, isSettingsOpen, setIsSettingsOpen)
                                : item.title === "Support"
                                  ? renderDropdown(item, isSupportOpen, setSupportOpen)
                                  : item.title === "Job"
                                    ? renderDropdown(item, isJobOpen, setJobOpen)
                                    : renderDropdown(item, false, () => { })}
              </motion.div>
            ))
          )}
        </nav>

        {isCollapsed && openDropdown && (
          <motion.div
            ref={floatingDropdownRef}
            className="floating-dropdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              position: "fixed",
              top: `${100 + (menuItems.findIndex(item => item.title === openDropdown) * 48)}px`,
              left: "70px",
              zIndex: 1000,
            }}
          >
            {menuItems
              .find((item) => item.title === openDropdown)
              ?.subItems.map((subItem, idx) => (
                <motion.div
                  key={subItem.path || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: idx * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <NavLink
                    to={subItem.path}
                    className={({ isActive }) =>
                      `floating-dropdown-item ${isActive ? 'active' : ''}`
                    }
                    onClick={() => {
                      setOpenDropdown(null);
                    }}
                  >
                    <span className="icon">{subItem.icon}</span>
                    <span className="title">{subItem.title}</span>
                  </NavLink>
                </motion.div>
              ))}
          </motion.div>
        )}

        <div className="sidebar-footer">
          <NavLink to="/dashboard/profile" className="nav-item profile-btn" onClick={handleNavigation}>
            <div className="nav-item-content">
              <span className="icon">
                <FiUser />
              </span>
              {!isCollapsed && <span className="title">Profile</span>}
            </div>
          </NavLink>
          <NavLink to="/logout" onClick={(e) => { e.preventDefault(); handleLogout(); handleNavigation(); }} className="nav-item logout-btn">
            <div className="nav-item-content">
              <span className="icon">
                <FiLogOut />
              </span>
              {!isCollapsed && <span className="title">Logout</span>}
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
