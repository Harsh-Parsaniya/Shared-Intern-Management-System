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
    interns {
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
