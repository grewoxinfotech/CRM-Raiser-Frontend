import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Button, Typography, Tag, Checkbox, Space, Divider, Avatar, Radio, Switch, message } from 'antd';
import { FiX, FiCalendar, FiCheckSquare,FiUserPlus , FiUser, FiShield, FiBriefcase, FiChevronDown } from 'react-icons/fi';
import dayjs from 'dayjs';
import { useGetUsersQuery } from '../../../../../user-management/users/services/userApi';
import { useGetRolesQuery } from '../../../../../hrm/role/services/roleApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../../../../../auth/services/authSlice';
import { useUpdateFollowupTaskMutation, useGetFollowupTaskByIdQuery } from './services/followupTaskApi';
import { useParams } from 'react-router-dom';
import CreateUser from '../../../../../user-management/users/CreateUser';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EditFollowupTask = ({ open, taskId, taskData, onCancel, onSubmit }) => {
  const idd = useParams();
  const dealId = idd.dealId;

  const [form] = Form.useForm();
  const [updateFollowupTask] = useUpdateFollowupTaskMutation();
  const { data: taskDataFromApi, isLoading } = useGetFollowupTaskByIdQuery(taskId);
  const [teamMembersOpen , setTeamMembersOpen] = useState(false);
  const [repeatType, setRepeatType] = useState('none');
  const [repeatEndType, setRepeatEndType] = useState('never');
  const [repeatTimes, setRepeatTimes] = useState(1);
  const [showReminder, setShowReminder] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [customRepeatInterval, setCustomRepeatInterval] = useState(1);
  const [customRepeatDays, setCustomRepeatDays] = useState([]);
  const [customFrequency, setCustomFrequency] = useState('weekly');
  const [monthlyPattern, setMonthlyPattern] = useState('day');
  const [yearlyPattern, setYearlyPattern] = useState('date');
  const [repeatEndDate, setRepeatEndDate] = useState(null);
  const [isCreateUserVisible, setIsCreateUserVisible] = useState(false);

  const getRoleColor = (role) => {
    const roleColors = {
      'employee': {
        color: '#D46B08',
        bg: '#FFF7E6',
        border: '#FFD591'
      },
      'admin': {
        color: '#096DD9',
        bg: '#E6F7FF',
        border: '#91D5FF'
      },
      'manager': {
        color: '#08979C',
        bg: '#E6FFFB',
        border: '#87E8DE'
      },
      'default': {
        color: '#531CAD',
        bg: '#F9F0FF',
        border: '#D3ADF7'
      }
    };
    return roleColors[role?.toLowerCase()] || roleColors.default;
  };

  const handleCreateUser = () => {
    setIsCreateUserVisible(true);
    setTeamMembersOpen(false);
  };

  const handleCreateUserSuccess = (newUser) => {
    setIsCreateUserVisible(false);
    setTeamMembersOpen(true);
    const currentAssignees = form.getFieldValue('assigned_to') || [];
    form.setFieldValue('assigned_to', [...currentAssignees, newUser.id]);
  };

  // Add formItemStyle constant
  const formItemStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937"
  };

  const inputStyle = {
    height: "48px", 
    borderRadius: "10px",
    padding: "8px 16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e6e8eb",
    transition: "all 0.3s ease"
  };

  const prefixIconStyle = {
    color: "#1890ff",
    fontSize: "16px",
    marginRight: "8px"
  };

  const selectStyle = {
    width: '100%',
    height: '48px'
  };

  const currentUser = useSelector(selectCurrentUser);
  const { data: usersResponse, isLoading: usersLoading } = useGetUsersQuery();
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();

  // Get subclient role ID to filter it out
  const subclientRoleId = rolesData?.data?.find(role => role?.role_name === 'sub-client')?.id;

  // Filter users to get team members (excluding subclients)
  const users = usersResponse?.data?.filter(user =>
    user?.created_by === currentUser?.username &&
    user?.role_id !== subclientRoleId
  ) || [];

  // Get role colors and icons
  const getRoleStyle = (roleName) => {
    const roleColors = {
      'employee': {
        color: '#D46B08',
        bg: '#FFF7E6', 
        border: '#FFD591',
        icon: <FiUser style={{ fontSize: '14px' }} />
      },
      'admin': {
        color: '#096DD9',
        bg: '#E6F7FF',
        border: '#91D5FF', 
        icon: <FiShield style={{ fontSize: '14px' }} />
      },
      'manager': {
        color: '#08979C',
        bg: '#E6FFFB',
        border: '#87E8DE',
        icon: <FiBriefcase style={{ fontSize: '14px' }} />
      },
      'default': {
        color: '#531CAD',
        bg: '#F9F0FF',
        border: '#D3ADF7',
        icon: <FiUser style={{ fontSize: '14px' }} />
      }
    };
    return roleColors[roleName?.toLowerCase()] || roleColors.default;
  };

  // Watch due_date field to enable repeat option
  useEffect(() => {
    const dueDate = form.getFieldValue('due_date');
    setShowRepeat(!!dueDate);
  }, [form.getFieldValue('due_date')]);

  // Update repeat availability when due date changes
  const handleDueDateChange = (date) => {
    setShowRepeat(!!date);
    if (!date) {
      setRepeatType('none');
    }
  };

  // Handle repeat toggle when no due date is selected
  const handleRepeatToggle = (checked) => {
    if (!showRepeat && checked) {
      message.info('Select a due date to set recurring');
      return;
    }
    setRepeatType(checked ? 'daily' : 'none');
  };

  // Initialize form with task data
  useEffect(() => {
    const task = taskData || taskDataFromApi?.data;

    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }

    console.log('Task data:', task);

    // Parse assigned_to
    let assignedTo = [];
    try {
      if (task.assigned_to) {
        const parsedAssignedTo = typeof task.assigned_to === 'string' 
          ? JSON.parse(task.assigned_to) 
          : task.assigned_to;
        const assignedIds = parsedAssignedTo.assigned_to || [];
        assignedTo = assignedIds.map(id => {
          const user = usersResponse?.data?.find(u => u.id === id);
          return user?.username;
        }).filter(username => username);
      }
    } catch (error) {
      console.error('Error parsing assigned_to:', error);
    }

    // If no assignees, use current user
    if (assignedTo.length === 0 && currentUser?.username) {
      assignedTo = [currentUser.username];
    }

    // Parse reminder
    let reminderData = null;
    try {
      if (task.reminder) {
        reminderData = typeof task.reminder === 'string' 
          ? JSON.parse(task.reminder) 
          : task.reminder;
      }
    } catch (error) {
      console.error('Error parsing reminder:', error);
    }

    // Parse repeat data
    let repeatData = null;
    try {
      if (task.repeat) {
        repeatData = typeof task.repeat === 'string' 
          ? JSON.parse(task.repeat) 
          : task.repeat;
      }
    } catch (error) {
      console.error('Error parsing repeat:', error);
    }

    // console.log('Parsed data:', {
    //   assignedTo,
    //   reminderData,
    //   repeatData
    // });

    // Set form values
    form.setFieldsValue({
      subject: task.subject,
      due_date: task.due_date ? dayjs(task.due_date) : null,
      priority: task.priority,
      task_reporter: task.task_reporter,
      assigned_to: assignedTo,
      status: task.status,
      description: task.description,
      created_by: task.created_by
    });

    // Set reminder state
    if (reminderData) {
      setShowReminder(true);
      form.setFieldsValue({
        reminder_date: reminderData.reminder_date ? dayjs(reminderData.reminder_date) : null,
        reminder_time: reminderData.reminder_time ? dayjs(reminderData.reminder_time, 'HH:mm:ss') : null
      });
    }

    // Set repeat state
    if (repeatData) {
      setShowRepeat(true);
      setRepeatType(repeatData.repeat_type || 'none');
      setRepeatEndType(repeatData.repeat_end_type || 'never');
      setRepeatTimes(repeatData.repeat_times || 1);
      setCustomRepeatInterval(repeatData.custom_repeat_interval || 1);
      setCustomRepeatDays(repeatData.custom_repeat_days || []);
      setCustomFrequency(repeatData.custom_repeat_frequency || 'weekly');
      setRepeatEndDate(repeatData.repeat_end_date ? dayjs(repeatData.repeat_end_date) : null);
    }

  }, [taskData, taskDataFromApi, form, taskId]);

  const handleSubmit = async (values) => {
    try {
      // Prepare reminder data
      const reminderData = showReminder ? {
        reminder_date: values.reminder_date?.format('YYYY-MM-DD'),
        reminder_time: values.reminder_time?.format('HH:mm:ss'),
      } : null;

      // Prepare repeat data
      const repeatData = showRepeat && repeatType !== 'none' ? {
        repeat_type: repeatType,
        repeat_end_type: repeatEndType,
        repeat_times: repeatTimes,
        repeat_end_date: repeatEndType === 'on' ? repeatEndDate?.format('YYYY-MM-DD') : null,
        custom_repeat_interval: customRepeatInterval,
        custom_repeat_days: customRepeatDays,
        custom_repeat_frequency: customFrequency,
      } : null;

      // Convert usernames to IDs for assigned_to
      const assignedUserIds = values.assigned_to && values.assigned_to.length > 0
        ? values.assigned_to.map(username => {
            const user = usersResponse?.data?.find(u => u.username === username);
            return user?.id;
          }).filter(id => id)
        : [currentUser?.id];

      // Format the update payload
      const updateData = {
        subject: values.subject,
        section: "deal",
        due_date: values.due_date?.format('YYYY-MM-DD'),
        priority: values.priority,
        task_reporter: values.task_reporter,
        assigned_to: {
          assigned_to: assignedUserIds
        },
        status: values.status,
        description: values.description,
        reminder: reminderData,
        repeat: repeatData,
        client_id: taskData?.data?.client_id,
        updated_by: currentUser?.username
      };

      const data = updateData;

      // Make the update API call
      const result = await updateFollowupTask({ id: taskId, data}).unwrap();

      if (result.success) {
        message.success('Task updated successfully');
        onCancel();
        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      message.error(error?.data?.message || 'Failed to update task');
    }
  };

  return (
    <>
      <Modal
        title={null}
        open={open}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnClose={true}
        centered
        closeIcon={null}
        className="pro-modal custom-modal"
        styles={{
          body: {
            padding: 0,
            borderRadius: "8px",
            overflow: "hidden",
          },
        }}
      >
        <div
          className="modal-header"
          style={{
            background: "linear-gradient(135deg, #4096ff 0%, #1677ff 100%)",
            padding: "24px",
            color: "#ffffff",
            position: "relative",
          }}
        >
          <Button
            type="text"
            onClick={onCancel}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              color: "#ffffff",
              width: "32px",
              height: "32px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <FiX style={{ fontSize: "20px" }} />
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <FiCheckSquare style={{ fontSize: "24px", color: "#ffffff" }} />
            </div>
            <div>
              <h2 style={{
                margin: "0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#ffffff",
              }}>
                Edit Task
              </h2>
              <Text style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.85)",
              }}>
                Update task details
              </Text>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ padding: "24px" }}
        >
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '16px', color: '#1f2937', display: 'block', marginBottom: '16px' }}>Task Details</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="subject"
                label={<span style={formItemStyle}>Subject</span>}
              >
                <Input
                  placeholder="Enter subject"
                  style={inputStyle}
                />
              </Form.Item>

              <Form.Item
                name="due_date"
                label={<span style={formItemStyle}>Due Date</span>}
              >
                <DatePicker
                  format="DD-MM-YYYY"
                  style={{
                    ...inputStyle,
                    width: '100%'
                  }}
                  suffixIcon={<FiCalendar style={{ color: "#4096ff" }} />}
                  onChange={handleDueDateChange}
                />
              </Form.Item>

              <Form.Item
                name="priority"
                label={<span style={formItemStyle}>Priority</span>}
              >
                <Select
                  placeholder="Select priority"
                  style={selectStyle}
                  suffixIcon={<FiChevronDown size={14} />}
                >
                  <Option value="highest">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
                      Highest - Urgent and Critical
                    </div>
                  </Option>
                  <Option value="high">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#faad14' }} />
                      High - Important
                    </div>
                  </Option>
                  <Option value="medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1890ff' }} />
                      Medium - Normal
                    </div>
                  </Option>
                  <Option value="low">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }} />
                      Low - Can Wait
                    </div>
                  </Option>
                </Select>
              </Form.Item>

            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '16px', color: '#1f2937', display: 'block', marginBottom: '16px' }}>Assignment</Text>
            <Form.Item
              name="assigned_to"
              label={<span style={{ fontSize: "14px", fontWeight: "500" }}>
                Assign To
              </span>}
            >
            <Select
                mode="multiple"
                placeholder="Select team members"
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '48px'
                }}
                listHeight={300}
                maxTagCount="responsive"
                maxTagTextLength={15}
                dropdownStyle={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollBehavior: 'smooth'
                }}
                popupClassName="team-members-dropdown"
                showSearch
                optionFilterProp="children"
                loading={usersLoading}
                open={teamMembersOpen}
                onDropdownVisibleChange={setTeamMembersOpen}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '0 8px',
                      justifyContent: 'flex-end'
                    }}>
                      <Button
                        type="text"
                        icon={<FiUserPlus style={{ fontSize: '16px', color: '#ffffff' }} />}
                        onClick={handleCreateUser}
                        style={{
                          height: '36px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
                        }}
                      >
                        Add New User
                      </Button>
                      <Button
                        type="text"
                        icon={<FiShield style={{ fontSize: '16px', color: '#1890ff' }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamMembersOpen(false);
                        }}
                        style={{
                          height: '36px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: '#ffffff',
                          border: '1px solid #1890ff',
                          color: '#1890ff',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e6f4ff';
                          e.currentTarget.style.borderColor = '#69b1ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#1890ff';
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </>
                )}
              >
                <Option key={currentUser?.username} value={currentUser?.username}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#e6f4ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1890ff',
                      fontSize: '16px',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {currentUser?.profilePic ? (
                        <img
                          src={currentUser.profilePic}
                          alt={currentUser.username}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        currentUser?.username?.charAt(0) || <FiUser />
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontWeight: 500,
                        color: 'rgba(0, 0, 0, 0.85)',
                        fontSize: '14px'
                      }}>
                        {currentUser?.username}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginLeft: 'auto'
                    }}>
                      <div
                        className="role-indicator"
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getRoleColor(currentUser?.roleName).color,
                          boxShadow: `0 0 8px ${getRoleColor(currentUser?.roleName).color}`,
                          animation: 'pulse 2s infinite'
                        }}
                      />
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: getRoleColor(currentUser?.roleName).bg,
                        color: getRoleColor(currentUser?.roleName).color,
                        border: `1px solid ${getRoleColor(currentUser?.roleName).border}`,
                        fontWeight: 500,
                        textTransform: 'capitalize'
                      }}>
                        {currentUser?.roleName || 'User'}
                      </span>
                    </div>
                  </div>
                </Option>
                {Array.isArray(users) && users.map(user => {
                  const userRole = rolesData?.data?.find(role => role.id === user.role_id);
                  const roleStyle = getRoleColor(userRole?.role_name);

                  return (
                    <Option key={user.username} value={user.username}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '4px 0'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#e6f4ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1890ff',
                          fontSize: '16px',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {user.profilePic ? (
                            <img
                              src={user.profilePic}
                              alt={user.username}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            user.username?.charAt(0) || <FiUser />
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '4px'
                        }}>
                          <span style={{
                            fontWeight: 500,
                            color: 'rgba(0, 0, 0, 0.85)',
                            fontSize: '14px'
                          }}>
                            {user.username}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginLeft: 'auto'
                        }}>
                          <div
                            className="role-indicator"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: roleStyle.color,
                              boxShadow: `0 0 8px ${roleStyle.color}`,
                              animation: 'pulse 2s infinite'
                            }}
                          />
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`,
                            fontWeight: 500,
                            textTransform: 'capitalize'
                          }}>
                            {userRole?.role_name || 'User'}
                          </span>
                        </div>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '16px', color: '#1f2937', display: 'block', marginBottom: '16px' }}>Task Status</Text>
            <Form.Item
              name="status"
              label={<span style={formItemStyle}>Status</span>}
            >
              <Select
                placeholder="Select status"
                style={selectStyle}
                suffixIcon={<FiChevronDown size={14} />}
              >
                <Option value="not_started">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d9d9d9' }} />
                    Not Started
                  </div>
                </Option>
                <Option value="in_progress">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1890ff' }} />
                    In Progress
                  </div>
                </Option>
                <Option value="completed">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }} />
                    Completed
                  </div>
                </Option>
                <Option value="on_hold">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#faad14' }} />
                    On Hold
                  </div>
                </Option>
                <Option value="cancelled">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
                    Cancelled
                  </div>
                </Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>Reminder</Text>
              <Switch checked={showReminder} onChange={setShowReminder} />
            </div>

            {showReminder && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="reminder_date"
                  label={<span style={formItemStyle}>Reminder Date</span>}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{
                      ...inputStyle,
                      width: '100%'
                    }}
                    suffixIcon={<FiCalendar style={{ color: "#4096ff" }} />}
                  />
                </Form.Item>

                <Form.Item
                  name="reminder_time"
                  label={<span style={formItemStyle}>Reminder Time</span>}
                >
                  <TimePicker
                    format="hh:mm A"
                    style={{
                      ...inputStyle,
                      width: '100%'
                    }}
                    use12Hours
                  />
                </Form.Item>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>Repeat</Text>
              <Switch 
                checked={repeatType !== 'none'} 
                onChange={handleRepeatToggle}
              />
            </div>

            {repeatType !== 'none' && (
              <div>
                <Form.Item
                  name="repeat"
                  label={<span style={formItemStyle}>Repeat Type</span>}
                >
                  <Select
                    placeholder="Select repeat option"
                    style={selectStyle}
                    value={repeatType}
                    onChange={(value) => setRepeatType(value)}
                    suffixIcon={<FiChevronDown size={14} />}
                  >
                    <Option value="daily">Daily</Option>
                    <Option value="weekly">Weekly</Option>
                    <Option value="monthly">Monthly</Option>
                    <Option value="yearly">Yearly</Option>
                    <Option value="custom">Custom</Option>
                  </Select>
                </Form.Item>

                {repeatType === 'custom' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '16px', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <Form.Item
                      name="repeat_frequency"
                      label={<span style={formItemStyle}>Frequency</span>}
                    >
                      <Select 
                        defaultValue="weekly" 
                        style={selectStyle}
                        onChange={(value) => setCustomFrequency(value)}
                        suffixIcon={<FiChevronDown size={14} />}
                      >
                        <Option value="weekly">Weekly</Option>
                        <Option value="monthly">Monthly</Option>
                        <Option value="yearly">Yearly</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={<span style={formItemStyle}>Repeat Every</span>}>
                      <Input.Group compact>
                        <Input 
                          type="number" 
                          min={1} 
                          value={customRepeatInterval}
                          onChange={(e) => setCustomRepeatInterval(e.target.value)}
                          style={{ 
                            width: '20%', 
                            ...inputStyle,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0
                          }}
                        />
                        <div style={{ 
                          lineHeight: '48px', 
                          padding: '0 16px', 
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e6e8eb',
                          borderLeft: 'none',
                          borderTopRightRadius: '10px',
                          borderBottomRightRadius: '10px'
                        }}>
                          {customFrequency === 'weekly' ? 'weeks' : customFrequency === 'monthly' ? 'months' : 'years'}
                        </div>
                      </Input.Group>
                    </Form.Item>

                    {customFrequency === 'weekly' && (
                      <Form.Item label={<span style={formItemStyle}>On These Days</span>}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                            <Button
                              key={day}
                              type={customRepeatDays.includes(index) ? 'primary' : 'default'}
                              shape="circle"
                              onClick={() => {
                                const newDays = customRepeatDays.includes(index)
                                  ? customRepeatDays.filter(d => d !== index)
                                  : [...customRepeatDays, index];
                                setCustomRepeatDays(newDays);
                              }}
                              style={{
                                width: '40px',
                                height: '40px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...(customRepeatDays.includes(index) ? {
                                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                  border: 'none'
                                } : {})
                              }}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </Form.Item>
                    )}

                    {customFrequency === 'monthly' && (
                      <Form.Item label={<span style={formItemStyle}>On</span>}>
                        <Space>
                          <Select style={{ width: 120 }} defaultValue="first">
                            <Option value="first">First</Option>
                            <Option value="second">Second</Option>
                            <Option value="third">Third</Option>
                            <Option value="fourth">Fourth</Option>
                            <Option value="last">Last</Option>
                          </Select>
                          <Select style={{ width: 120 }} defaultValue="monday">
                            <Option value="sunday">Sunday</Option>
                            <Option value="monday">Monday</Option>
                            <Option value="tuesday">Tuesday</Option>
                            <Option value="wednesday">Wednesday</Option>
                            <Option value="thursday">Thursday</Option>
                            <Option value="friday">Friday</Option>
                            <Option value="saturday">Saturday</Option>
                          </Select>
                        </Space>
                      </Form.Item>
                    )}

                    {customFrequency === 'yearly' && (
                      <Form.Item label={<span style={formItemStyle}>On</span>}>
                        <Space direction="vertical">
                          <Space>
                            <Select style={{ width: 120 }} defaultValue="1">
                              {Array.from({ length: 12 }, (_, i) => (
                                <Option key={i + 1} value={i + 1}>
                                  {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                                </Option>
                              ))}
                            </Select>
                            <Select style={{ width: 120 }} defaultValue="first">
                              <Option value="first">First</Option>
                              <Option value="second">Second</Option>
                              <Option value="third">Third</Option>
                              <Option value="fourth">Fourth</Option>
                              <Option value="last">Last</Option>
                            </Select>
                            <Select style={{ width: 120 }} defaultValue="monday">
                              <Option value="sunday">Sunday</Option>
                              <Option value="monday">Monday</Option>
                              <Option value="tuesday">Tuesday</Option>
                              <Option value="wednesday">Wednesday</Option>
                              <Option value="thursday">Thursday</Option>
                              <Option value="friday">Friday</Option>
                              <Option value="saturday">Saturday</Option>
                            </Select>
                          </Space>
                        </Space>
                      </Form.Item>
                    )}
                  </div>
                )}

                <div style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px',
                  backgroundColor: '#f8fafc'
                }}>
                  <Form.Item
                    label={<span style={formItemStyle}>Ends</span>}
                    style={{ marginBottom: '16px' }}
                  >
                    <Radio.Group 
                      value={repeatEndType}
                      onChange={(e) => setRepeatEndType(e.target.value)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Radio value="never">Never</Radio>
                        <Radio value="after">
                          <Space align="center">
                            After{' '}
                            <Input
                              type="number"
                              min={1}
                              value={repeatTimes}
                              onChange={(e) => setRepeatTimes(e.target.value)}
                              style={{ 
                                width: '60px',
                                ...inputStyle,
                                height: '32px'
                              }}
                              disabled={repeatEndType !== 'after'}
                            />
                            {' '}Times
                          </Space>
                        </Radio>
                        <Radio value="on">
                          <Space align="center">
                            On{' '}
                            <DatePicker
                              value={repeatEndDate}
                              onChange={(date) => setRepeatEndDate(date)}
                              disabled={repeatEndType !== 'on'}
                              format="DD/MM/YYYY"
                              style={{
                                ...inputStyle,
                                height: '32px'
                              }}
                            />
                          </Space>
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </div>
            )}
          </div>

          <Form.Item
            name="description"
            label={<span style={formItemStyle}>Description</span>}
          >
            <TextArea
              placeholder="Enter task description"
              rows={4}
              style={{
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e6e8eb"
              }}
            />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Update Task
            </Button>
          </div>
        </Form>
      </Modal>

      <CreateUser
        visible={isCreateUserVisible}
        onCancel={() => {
          setIsCreateUserVisible(false);
          setTeamMembersOpen(true);
        }}
        onSuccess={handleCreateUserSuccess}
      />
    </>
  );
};

export default EditFollowupTask; 