export const commonStyles = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    color: #333;
  }
  h1 {
    color: #1976d2;
    border-bottom: 2px solid #1976d2;
    padding-bottom: 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .summary {
    margin-top: 30px;
    padding: 15px;
    background-color: #e3f2fd;
    border-radius: 4px;
  }
  .member-row:hover,
  .request-row:hover {
    background-color: #e1f5fe;
  }
  .status-approved {
    color: #43a047;
    font-weight: bold;
  }
  .status-rejected {
    color: #e53935;
    font-weight: bold;
  }
  .status-pending {
    color: #fb8c00;
    font-weight: bold;
  }
  .status-ongoing {
    color: #2196f3;
    font-weight: bold;
  }
  .status-completed {
    color: #293cf7;
    font-weight: bold;
  }
  .status-scheduled {
    color: #9c27b0;
  }
`;

export const expiredTokenStyles = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    color: #333;
    text-align: center;
  }
  .container {
    max-width: 600px;
    margin: 50px auto;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  h1 {
    color: #e74c3c;
  }
  p {
    font-size: 18px;
    line-height: 1.6;
  }
  .message {
    margin: 20px 0;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
`;
