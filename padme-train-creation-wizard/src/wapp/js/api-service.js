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

const uploadDataAnalysisTask = (file, trainType) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("train_type", trainType);

    fetch(apiEndpoint + "upload/task", {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getHeaders(),
      },
      body: formData,
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });
};

const uploadReqFile = (file, trainId) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    fetch(apiEndpoint + "upload/req-file/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getHeaders(),
      },
      body: formData,
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const uploadDockerfile = (file, trainId) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    fetch(apiEndpoint + "upload/dockerfile/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getHeaders(),
      },
      body: formData,
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getConnectionCredentials = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "connection-creds/" + trainId, {
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

const cancelTrainCreation = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "upload/" + trainId, {
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

const saveConnectionCredentials = (connectionParams, trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "connection-creds/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(connectionParams),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getMetadata = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "metadata/" + trainId, {
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

const saveMetadata = (metadata, trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "metadata/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(metadata),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getDockerfileContent = (trainId, pyMainFile, customFileFlag) =>
  new Promise((resolve, reject) => {
    fetch(
      apiEndpoint +
        "upload/template-dockerfile/" +
        trainId +
        "?py_main=" +
        pyMainFile +
        "&custom_file=" +
        customFileFlag,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
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

const saveDockerfileContent = (standardDockerfile, trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "upload/template-dockerfile/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(standardDockerfile),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getTrainSummary = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "summary/" + trainId, {
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

const getGitInfo = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "git-op/git-info/" + trainId, {
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

const uploadFilesToGit = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "git-op/git-repo/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
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

const getEntryPointFiles = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "upload/task/entrypoint/" + trainId, {
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

const savePrivateGitInfo = (git_info, trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "git-op/private-git-info/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(git_info),
    }).then((response) => {
      if (response.status == 200) {
        response.json().then((response) => resolve(response));
      } else {
        response.json().then((response) => reject(response));
      }
    });
  });

const getGitInfoParams = (trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "git-op/private-git-info/" + trainId, {
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

const createGitBranchCommitData = (git_branch_commit_data, trainId) =>
  new Promise((resolve, reject) => {
    fetch(apiEndpoint + "git-op/git-branch/" + trainId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify(git_branch_commit_data),
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
    fetch(apiEndpoint + "authentication/login", {
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
  uploadDataAnalysisTask,
  uploadReqFile,
  uploadDockerfile,
  getConnectionCredentials,
  cancelTrainCreation,
  saveConnectionCredentials,
  getMetadata,
  saveMetadata,
  getDockerfileContent,
  saveDockerfileContent,
  getTrainSummary,
  getGitInfo,
  uploadFilesToGit,
  getEntryPointFiles,
  savePrivateGitInfo,
  getGitInfoParams,
  createGitBranchCommitData,
  authenticateGitUser,
  revokeGitlabToken,
  verifyUserGitlabCredentials,
};
