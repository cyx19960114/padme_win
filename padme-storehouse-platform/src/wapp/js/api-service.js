import { getCredentials } from "./main.js";
import { API_ENDPOINT } from "./constants.js";

const apiEndpoint = window.location.origin + API_ENDPOINT;

const getHeaders = () => {
  const { username, token, pat } = getCredentials();
  return {
    Authorization: "Bearer " + token,
    Username: username,
    pat: pat,
  };
};

const showAllTrainImages = (trainStore, branchName) =>
  new Promise((resolve, reject) => {
    fetch(`${apiEndpoint}gitlab/images/${trainStore}/${branchName}`, {
      method: "GET",
      headers: { ...getHeaders() },
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const fetchSpecificTrainDetails = (projectBranchObj) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "gitlab/images/info", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(projectBranchObj),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const authenticateGitUser = (user_info) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "authentication", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(user_info),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const revokeGitlabToken = () =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "authentication/revoke", {
      method: "DELETE",
      headers: {
        ...getHeaders(),
      },
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getAllGitBranches = (trainStore) =>
  new Promise((resolve, reject) => {
    fetch(`${apiEndpoint}gitlab/branches/${trainStore}`, {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const saveUserFeedback = (feedbackObj) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "gitlab/save-feedback", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(feedbackObj),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const createGitMergeRequestAfterApproval = (mergeRequestObj) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "gitlab/merge-request", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(mergeRequestObj),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const pushGitMergeRequest = (pushRequestObj) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "gitlab/merge-request/merge", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(pushRequestObj),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getFolderContents = (trainStore, branchName, projectName) =>
  new Promise((resolve, reject) => {
    fetch(
      `${apiEndpoint}gitlab/images/${trainStore}/${branchName}/${projectName}`,
      {
        method: "GET",
        headers: {
          ...getHeaders(),
        },
      }
    ).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const verifyUserGitlabCredentials = () =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "authentication/verify", {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    }).then(async (response) => {
      const response_body = await response.json();
      if (response_body.status_code == 200) {
        resolve(response_body.pat);
      } else {
        resolve(null);
      }
    });
  });

export {
  showAllTrainImages,
  fetchSpecificTrainDetails,
  authenticateGitUser,
  revokeGitlabToken,
  getAllGitBranches,
  saveUserFeedback,
  createGitMergeRequestAfterApproval,
  pushGitMergeRequest,
  getFolderContents,
  verifyUserGitlabCredentials,
};
