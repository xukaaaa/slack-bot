/**
 * Redmine Integration Module
 * Handles creation and retrieval of issues/tasks in Redmine via REST API
 */

/**
 * Update an existing issue in Redmine
 * @param {Object} args - Update parameters
 * @param {number} args.issue_id - Issue ID to update (required)
 * @param {string} args.subject - New subject/title (optional)
 * @param {string} args.description - New description (optional)
 * @param {number} args.status_id - New status ID (optional)
 * @param {number} args.priority_id - New priority (optional)
 * @param {number} args.tracker_id - New tracker (optional)
 * @param {number} args.estimated_hours - New estimated hours (optional)
 * @param {string} args.start_date - New start date YYYY-MM-DD (optional)
 * @param {string} args.due_date - New due date YYYY-MM-DD (optional)
 * @param {number} args.done_ratio - Completion percentage 0-100 (optional)
 * @param {string} args.assigned_to_id - New assignee user ID (optional)
 * @param {string} args.notes - Comment about the update (optional)
 * @param {string} args.actual_start_date - Actual start date YYYY-MM-DD (custom field, required for Completed status)
 * @param {string} args.actual_finish_date - Actual finish date YYYY-MM-DD (custom field, required for Completed status)
 * @returns {Promise<Object>} Result object with success status
 */
export async function executeUpdateRedmineIssue(args) {
  const {
    issue_id,
    subject,
    description,
    status_id,
    priority_id,
    tracker_id,
    estimated_hours,
    start_date,
    due_date,
    done_ratio,
    assigned_to_id,
    notes,
    actual_start_date,
    actual_finish_date
  } = args;

  console.log(`[REDMINE] Updating issue #${issue_id}`);

  // Get Redmine config from env
  const redmineUrl = process.env.REDMINE_URL;
  const redmineApiKey = process.env.REDMINE_API_KEY;

  // Validate config
  if (!redmineUrl || !redmineApiKey) {
    console.error('[REDMINE] Missing configuration');
    return {
      success: false,
      message: 'Redmine chưa được cấu hình. Cần set REDMINE_URL và REDMINE_API_KEY'
    };
  }

  if (!issue_id) {
    return {
      success: false,
      message: 'Thiếu issue_id. Cần chỉ định ID của issue cần update.'
    };
  }

  try {
    // Build update payload
    const issueData = {
      issue: {}
    };

    // Add fields to update (only if provided)
    if (subject !== undefined) issueData.issue.subject = subject;
    if (description !== undefined) issueData.issue.description = description;
    if (status_id !== undefined) issueData.issue.status_id = status_id;
    if (priority_id !== undefined) issueData.issue.priority_id = priority_id;
    if (tracker_id !== undefined) issueData.issue.tracker_id = tracker_id;
    if (estimated_hours !== undefined) issueData.issue.estimated_hours = estimated_hours;
    if (start_date !== undefined) issueData.issue.start_date = start_date;
    if (due_date !== undefined) issueData.issue.due_date = due_date;
    if (done_ratio !== undefined) issueData.issue.done_ratio = done_ratio;
    if (assigned_to_id !== undefined) issueData.issue.assigned_to_id = assigned_to_id;
    if (notes !== undefined) issueData.issue.notes = notes;

    // Add custom fields if provided
    const customFields = [];
    if (actual_start_date !== undefined) {
      customFields.push({ id: 10, value: actual_start_date }); // Act.Start
    }
    if (actual_finish_date !== undefined) {
      customFields.push({ id: 5, value: actual_finish_date }); // Act.Finish
    }
    if (customFields.length > 0) {
      issueData.issue.custom_fields = customFields;
    }

    console.log('[REDMINE] Update payload:', JSON.stringify(issueData));

    // Call Redmine API
    const response = await fetch(`${redmineUrl}/issues/${issue_id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Redmine-API-Key': redmineApiKey
      },
      body: JSON.stringify(issueData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REDMINE] API error:', response.status, errorText);
      return {
        success: false,
        message: `Lỗi khi update issue: ${response.status} - ${errorText}`
      };
    }

    console.log('[REDMINE] Issue updated successfully:', issue_id);

    const issueUrl = `${redmineUrl}/issues/${issue_id}`;

    return {
      success: true,
      message: `Đã update issue #${issue_id} thành công`,
      issue: {
        id: issue_id,
        url: issueUrl,
        updated_fields: Object.keys(issueData.issue)
      }
    };
  } catch (error) {
    console.error('[REDMINE] Error:', error);
    return {
      success: false,
      message: `Lỗi khi update issue: ${error.message}`
    };
  }
}

/**
 * Get list of project members
 * @returns {Promise<Object>} Result object with members list
 */
export async function executeGetRedmineMembers() {
  console.log(`[REDMINE] Getting project members`);

  // Get Redmine config from env
  const redmineUrl = process.env.REDMINE_URL;
  const redmineApiKey = process.env.REDMINE_API_KEY;
  const projectId = process.env.REDMINE_DEFAULT_PROJECT_ID;

  // Validate config
  if (!redmineUrl || !redmineApiKey || !projectId) {
    console.error('[REDMINE] Missing configuration');
    return {
      success: false,
      message: 'Redmine chưa được cấu hình. Cần set REDMINE_URL, REDMINE_API_KEY, và REDMINE_DEFAULT_PROJECT_ID'
    };
  }

  try {
    // Call Redmine API
    const response = await fetch(`${redmineUrl}/projects/${projectId}/memberships.json`, {
      method: 'GET',
      headers: {
        'X-Redmine-API-Key': redmineApiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REDMINE] API error:', response.status, errorText);
      return {
        success: false,
        message: `Lỗi khi lấy danh sách members: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    const memberships = result.memberships || [];

    console.log('[REDMINE] Found', memberships.length, 'members');

    // Format members for display
    const formattedMembers = memberships
      .filter(m => m.user) // Only users, not groups
      .map(m => ({
        id: m.user.id,
        name: m.user.name,
        roles: m.roles.map(r => r.name).join(', ')
      }));

    return {
      success: true,
      message: `Tìm thấy ${formattedMembers.length} members`,
      members: formattedMembers
    };
  } catch (error) {
    console.error('[REDMINE] Error:', error);
    return {
      success: false,
      message: `Lỗi khi lấy danh sách members: ${error.message}`
    };
  }
}

/**
 * Get list of issues from Redmine
 * @param {Object} args - Query parameters
 * @param {string} args.status - Filter by status: 'open', 'closed', '*' (all), or status_id
 * @param {string} args.assigned_to_id - Filter by assigned user: user_id or 'me'
 * @param {number} args.limit - Number of issues to return (default: 10, max: 100)
 * @param {string} args.sort - Sort by field: 'updated_on', 'priority', 'status' (add :desc for descending)
 * @returns {Promise<Object>} Result object with issues list
 */
export async function executeGetRedmineIssues(args) {
  const {
    status = 'open',
    assigned_to_id,
    limit = 10,
    sort = 'updated_on:desc'
  } = args;

  console.log(`[REDMINE] Getting issues with filters:`, args);

  // Get Redmine config from env
  const redmineUrl = process.env.REDMINE_URL;
  const redmineApiKey = process.env.REDMINE_API_KEY;
  const projectId = process.env.REDMINE_DEFAULT_PROJECT_ID;

  // Validate config
  if (!redmineUrl || !redmineApiKey || !projectId) {
    console.error('[REDMINE] Missing configuration');
    return {
      success: false,
      message: 'Redmine chưa được cấu hình. Cần set REDMINE_URL, REDMINE_API_KEY, và REDMINE_DEFAULT_PROJECT_ID'
    };
  }

  try {
    // Build query parameters
    const params = new URLSearchParams({
      project_id: projectId,
      status_id: status,
      limit: Math.min(limit, 100), // Cap at 100
      sort: sort
    });

    // Add optional filters
    if (assigned_to_id) {
      params.append('assigned_to_id', assigned_to_id);
    }

    console.log('[REDMINE] Query params:', params.toString());

    // Call Redmine API
    const response = await fetch(`${redmineUrl}/issues.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Redmine-API-Key': redmineApiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REDMINE] API error:', response.status, errorText);
      return {
        success: false,
        message: `Lỗi khi lấy danh sách issues: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    const issues = result.issues || [];
    const totalCount = result.total_count || 0;

    console.log('[REDMINE] Found', issues.length, 'issues (total:', totalCount, ')');

    // Format issues for display
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      subject: issue.subject,
      status: issue.status?.name || 'Unknown',
      priority: issue.priority?.name || 'Normal',
      tracker: issue.tracker?.name || 'Task',
      assigned_to: issue.assigned_to?.name || 'Unassigned',
      author: issue.author?.name || 'Unknown',
      done_ratio: issue.done_ratio || 0,
      estimated_hours: issue.estimated_hours || null,
      start_date: issue.start_date || null,
      due_date: issue.due_date || null,
      parent_id: issue.parent?.id || null,
      created_on: issue.created_on,
      updated_on: issue.updated_on,
      url: `${redmineUrl}/issues/${issue.id}`
    }));

    return {
      success: true,
      message: `Tìm thấy ${issues.length} issues (tổng: ${totalCount})`,
      total_count: totalCount,
      issues: formattedIssues
    };
  } catch (error) {
    console.error('[REDMINE] Error:', error);
    return {
      success: false,
      message: `Lỗi khi lấy danh sách issues: ${error.message}`
    };
  }
}

/**
 * Create a new issue in Redmine
 * @param {Object} args - Issue parameters
 * @param {string} args.subject - Issue title (required)
 * @param {string} args.description - Issue description (optional)
 * @param {number} args.priority_id - Priority: 3=Low, 4=Normal, 5=High, 6=Urgent, 7=Immediate
 * @param {number} args.tracker_id - Tracker: 1=Bug, 2=Feature, 3=Support
 * @param {number} args.estimated_hours - Estimated hours (optional)
 * @param {string} args.start_date - Start date in YYYY-MM-DD format (optional)
 * @param {string} args.due_date - Due date in YYYY-MM-DD format (optional)
 * @param {number} args.parent_issue_id - Parent issue ID for subtasks (optional)
 * @param {string} args.assigned_to_id - User ID to assign (optional)
 * @returns {Promise<Object>} Result object with success status and issue details
 */
export async function executeCreateRedmineIssue(args) {
  const {
    subject,
    description,
    priority_id = 4, // Default: Normal
    tracker_id = 2,  // Default: Feature
    estimated_hours,
    start_date,
    due_date,
    parent_issue_id,
    assigned_to_id
  } = args;

  console.log(`[REDMINE] Creating issue: ${subject}`);

  // Get Redmine config from env
  const redmineUrl = process.env.REDMINE_URL;
  const redmineApiKey = process.env.REDMINE_API_KEY;
  const projectId = process.env.REDMINE_DEFAULT_PROJECT_ID;

  // Validate config
  if (!redmineUrl || !redmineApiKey || !projectId) {
    console.error('[REDMINE] Missing configuration');
    return {
      success: false,
      message: 'Redmine chưa được cấu hình. Cần set REDMINE_URL, REDMINE_API_KEY, và REDMINE_DEFAULT_PROJECT_ID'
    };
  }

  try {
    // Build issue payload
    const issueData = {
      issue: {
        project_id: parseInt(projectId),
        subject: subject,
        tracker_id: tracker_id,
        priority_id: priority_id
      }
    };

    // Add optional fields
    if (description) {
      issueData.issue.description = description;
    }
    if (estimated_hours) {
      issueData.issue.estimated_hours = estimated_hours;
    }
    if (start_date) {
      issueData.issue.start_date = start_date;
    }
    if (due_date) {
      issueData.issue.due_date = due_date;
    }
    if (parent_issue_id) {
      issueData.issue.parent_issue_id = parent_issue_id;
    }
    if (assigned_to_id) {
      issueData.issue.assigned_to_id = assigned_to_id;
    }

    console.log('[REDMINE] Payload:', JSON.stringify(issueData));

    // Call Redmine API
    const response = await fetch(`${redmineUrl}/issues.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Redmine-API-Key': redmineApiKey
      },
      body: JSON.stringify(issueData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REDMINE] API error:', response.status, errorText);
      return {
        success: false,
        message: `Lỗi khi tạo issue: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    const issueId = result.issue?.id;
    const issueUrl = `${redmineUrl}/issues/${issueId}`;

    console.log('[REDMINE] Issue created:', issueId);

    return {
      success: true,
      message: `Đã tạo issue #${issueId} thành công`,
      issue: {
        id: issueId,
        url: issueUrl,
        subject: subject,
        priority: getPriorityName(priority_id),
        tracker: getTrackerName(tracker_id)
      }
    };
  } catch (error) {
    console.error('[REDMINE] Error:', error);
    return {
      success: false,
      message: `Lỗi khi tạo issue: ${error.message}`
    };
  }
}

/**
 * Get priority name from ID
 * @param {number} id - Priority ID
 * @returns {string} Priority name
 */
function getPriorityName(id) {
  const priorities = {
    3: 'Low',
    4: 'Normal',
    5: 'High',
    6: 'Urgent',
    7: 'Immediate'
  };
  return priorities[id] || 'Normal';
}

/**
 * Get tracker name from ID
 * @param {number} id - Tracker ID
 * @returns {string} Tracker name
 */
function getTrackerName(id) {
  const trackers = {
    1: 'Bug',
    2: 'Feature',
    3: 'Support'
  };
  return trackers[id] || 'Feature';
}
