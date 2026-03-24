import { gql } from "@apollo/client";

export interface DashboardStats {
  interns_aggregate: {
    aggregate: {
      count: number;
    };
  };
  feedback_aggregate: {
    aggregate: {
      count: number;
    };
  };
  recent_interns: Array<{
    id: string;
    college_name: string;
    user: {
      name: string;
    };
  }>;
}

export interface Intern {
  id: string;
  college_name: string;
  department_id: string;
  start_date: string;
  end_date: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    name: string;
  } | null;
}

export interface InternsData {
  interns: Intern[];
}

export interface Department {
  id: string;
  name: string;
  interns_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export interface DepartmentsData {
  departments: Department[];
}

export interface Feedback {
  id: string;
  message: string;
  rating: number;
  created_at: string;
  intern: {
    user: {
      name: string;
    };
  };
}

export interface FeedbackData {
  feedback: Feedback[];
}


export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    interns_aggregate {
      aggregate {
        count
      }
    }
    feedback_aggregate {
      aggregate {
        count
      }
    }
    recent_interns: interns(order_by: {id: desc}, limit: 5) {
      id
      college_name
      user {
        name
      }
    }
  }
`;

export const GET_INTERNS = gql`
  query GetInterns {
    interns(order_by: {user: {name: asc}}) {
      id
      college_name
      department_id
      start_date
      end_date
      user {
        id
        name
        email
        role
      }
      department {
        name
      }
    }
  }
`;

export const GET_FEEDBACK = gql`
  query GetFeedback {
    feedback(order_by: {created_at: desc}) {
      id
      message
      rating
      created_at
      intern {
        user {
          name
        }
      }
    }
  }
`;

export const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback($internId: uuid!, $message: String!, $rating: Int!) {
    insert_feedback_one(object: {
      intern_id: $internId,
      message: $message,
      rating: $rating
    }) {
      id
    }
  }
`;

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments(order_by: {name: asc}) {
      id
      name
      interns_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const LOGIN_USER = gql`
  query LoginUser($email: String!) {
    users(where: {email: {_eq: $email}}) {
      id
      name
      password
      role
      department_id
    }
  }
`;

export const SIGN_UP_USER = gql`
  mutation SignUpUser($name: String!, $email: String!, $password: String!, $role: String!) {
    insert_users_one(object: {
      name: $name, 
      email: $email, 
      password: $password, 
      role: $role
    }) {
      id
      role
    }
  }
`;

export const GET_DEPT_DASHBOARD_STATS = gql`
  query GetDeptDashboardStats($departmentId: uuid!) {
    interns_aggregate(where: {department_id: {_eq: $departmentId}}) {
      aggregate {
        count
      }
    }
    feedback_aggregate(where: {intern: {department_id: {_eq: $departmentId}}}) {
      aggregate {
        count
      }
    }
    recent_interns: interns(
      where: {department_id: {_eq: $departmentId}},
      order_by: {id: desc}, 
      limit: 5
    ) {
      id
      college_name
      user {
        name
      }
    }
  }
`;

export const GET_INTERN_DASHBOARD_DATA = gql`
  query GetInternDashboardData($userId: uuid!) {
    interns(where: {user_id: {_eq: $userId}}) {
      id
      college_name
      start_date
      end_date
      department {
        name
      }
      user {
        name
        email
      }
    }
    feedback(where: {intern: {user_id: {_eq: $userId}}}, order_by: {created_at: desc}) {
      id
      message
      rating
      created_at
    }
  }
`;

export const ADD_INTERN = gql`
  mutation AddIntern($object: interns_insert_input!) {
    insert_interns_one(object: $object) {
      id
      user {
        id
        name
      }
    }
  }
`;

export const UPDATE_INTERN = gql`
  mutation UpdateIntern($userId: uuid!, $userName: String!, $userEmail: String!, $internId: uuid!, $collegeName: String!, $deptId: uuid!, $startDate: date!, $endDate: date!) {
    update_users_by_pk(pk_columns: {id: $userId}, _set: {name: $userName, email: $userEmail}) {
      id
    }
    update_interns_by_pk(pk_columns: {id: $internId}, _set: {college_name: $collegeName, department_id: $deptId, start_date: $startDate, end_date: $endDate}) {
      id
    }
  }
`;

export const DELETE_INTERN = gql`
  mutation DeleteIntern($userId: uuid!) {
    delete_users_by_pk(id: $userId) {
      id
    }
  }
`;

export const ADD_DEPARTMENT = gql`
  mutation AddDepartment($name: String!) {
    insert_departments_one(object: {name: $name}) {
      id
      name
    }
  }
`;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($id: uuid!, $name: String!) {
    update_departments_by_pk(pk_columns: {id: $id}, _set: {name: $name}) {
      id
      name
    }
  }
`;

export const DELETE_DEPARTMENT = gql`
  mutation DeleteDepartment($id: uuid!) {
    delete_departments_by_pk(id: $id) {
      id
    }
  }
`;
