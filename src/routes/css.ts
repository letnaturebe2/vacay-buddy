export const commonStyles = `
  body {
    font-family: 'Noto Sans KR', Arial, sans-serif;
    margin: 0;
    padding: 20px;
    color: #333;
    background-color: #f5f7fa;
  }
  h1 {
    color: #1976d2;
    border-bottom: 2px solid #1976d2;
    padding-bottom: 10px;
    margin-bottom: 25px;
  }
  h2 {
    color: #333;
    margin-top: 0;
    margin-bottom: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  th, td {
    border: 1px solid #eee;
    padding: 12px 15px;
    text-align: left;
  }
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #444;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .summary {
    margin-top: 30px;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  .member-row:hover,
  .request-row:hover {
    background-color: #e8f4fd;
    transition: background-color 0.2s ease;
  }
  .status-approved {
    color: #43a047;
    font-weight: 600;
  }
  .status-rejected {
    color: #e53935;
    font-weight: 600;
  }
  .status-pending {
    color: #fb8c00;
    font-weight: 600;
  }
  .status-ongoing {
    color: #2196f3;
    font-weight: 600;
  }
  .status-completed {
    color: #293cf7;
    font-weight: 600;
  }
  .status-scheduled {
    color: #9c27b0;
    font-weight: 600;
  }
  .clickable {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .clickable:hover {
    background-color: #f0f7ff;
  }
  
  /* DataTables 스타일 개선 */
  .dataTables_wrapper {
    padding: 0;
    font-size: 14px;
  }
  .dataTables_length,
  .dataTables_filter {
    margin-bottom: 15px;
  }
  .dataTables_info,
  .dataTables_paginate {
    margin-top: 15px;
  }
  .dataTables_paginate .paginate_button {
    padding: 5px 10px;
    margin: 0 2px;
    border-radius: 4px;
  }
  .dataTables_paginate .paginate_button.current {
    background: #1976d2 !important;
    color: white !important;
    border: 1px solid #1976d2 !important;
  }
  .dataTables_paginate .paginate_button:hover {
    background: #e8f4fd !important;
    color: #1976d2 !important;
    border: 1px solid #e8f4fd !important;
  }
  
  /* 반응형 스타일 */
  @media (max-width: 768px) {
    .pto-info {
      flex-direction: column;
    }
    .pto-info-item {
      margin-bottom: 15px;
    }
    .year-selector {
      flex-direction: column;
      align-items: flex-start;
    }
    .year-selector select,
    .year-selector button {
      margin-top: 10px;
      margin-left: 0;
      width: 100%;
    }
  }
`;

export const expiredTokenStyles = `
  body {
    font-family: 'Noto Sans KR', Arial, sans-serif;
    margin: 0;
    padding: 20px;
    color: #333;
    text-align: center;
    background-color: #f5f7fa;
  }
  .container {
    max-width: 600px;
    margin: 50px auto;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    background-color: white;
  }
  h1 {
    color: #e74c3c;
    margin-bottom: 25px;
  }
  p {
    font-size: 18px;
    line-height: 1.6;
    color: #555;
  }
  .message {
    margin: 30px 0;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #e74c3c;
  }
`;
