import * as apiService from "./api-service.js";
import Appstore from "./appstore.js";
import { KC_REALM, KC_CLIENT_ID, KC_URL } from "./constants.js";

// Appstore pages section
const appstore = new Appstore();

// First page - gitlab user authentication
appstore.addPage(
  "GitLab User Authentication",
  () => {
    // on load event listener
    // disable the buttons
    appstore.disableRightButton();
    appstore.disableLeftButton();
    appstore.disableCenterButton();

    if (appstore.getSharedDataForKey("gitlab-authenticated")) {
      appstore.viewNextPage();
    } else {
      $("#auth-loading").show();
      $("#register-page").hide();
      apiService.verifyUserGitlabCredentials().then((pat) => {
        if (pat) {
          $("#auth-loading").hide();
          appstore.setSharedDataForKey("gitlab-authenticated", true);
          appstore.setSharedDataForKey("pat", pat);
          appstore.viewNextPage();
        } else {
          $("#auth-loading").hide();
          $("#register-page").show();
          appstore.setSharedDataForKey("gitlab-authenticated", false);
          appstore.setSharedDataForKey("pat", null);
        }
      });
    }

    $("#login-btn").click(function () {
      $("#auth-loading").show();
      var authObj = new Object();
      authObj.username = $("#usrnm").val();
      authObj.pat = $("#psw").val();
      apiService
        .authenticateGitUser(authObj)
        .then((response) => {
          var response_status_code = response.status_code;
          if (response_status_code === 200) {
            $("#auth-loading").hide();
            appstore.setSharedDataForKey("gitlab-authenticated", true);
            appstore.setSharedDataForKey("pat", authObj.pat);
            appstore.viewNextPage();
          } else {
            $("#auth-loading").hide();
            alert(response.message);
          }
        })
        .catch((error) => {
          $("#auth-loading").hide();
          alert(error.message);
        });
    });

    callHelpModalUtility();
  },
  "",
  () => {}, // left button event listener,  do nothing
  "",
  () => {}, // right button event listener, do nothing
  "",
  () => {} // center button event listener, do nothing
);

appstore.addPage(
  "Select Train Store",
  () => {
    // on load event listener
    appstore.enableRightButton();
    appstore.disableCenterButton();
  },
  "",
  () => {}, // left button event listener,  do nothing
  "Next",
  () => {
    // right button event listener
    const selectedTrainStore = $("#train-store-form input:checked").val();
    appstore.setSharedDataForKey("train-store", selectedTrainStore);
    appstore.viewNextPage();
  }
);

// Second page - show all branches in the repository
appstore.addPage(
  "Official Train Store Git Branches",
  () => {
    // on load event listener
    // enable the buttons
    appstore.enableCenterButton();
    $("#git-branches-grids").empty();
    const trainStore = appstore.getSharedDataForKey("train-store");
    $("#appstore-loading-gif").show();
    apiService
      .getAllGitBranches(trainStore)
      .then((response) => {
        $("#appstore-loading-gif").hide();
        for (var i = 0; i < response.length; i++) {
          var branch_grid =
            '<div class="grid_cols"><ul class="grid_img"><li class="grid_header">';
          branch_grid += response[i];
          branch_grid += '</li><li class="grid_grey"><input type="submit" id="';
          branch_grid += response[i];
          branch_grid +=
            '" class="grid_button" value="Show Train Images" /></li></ul></div>';
          $("#git-branches-grids").append(branch_grid);
        }
      })
      .catch((error) => {
        $("#appstore-loading-gif").hide();
        alert(error.message);
      });
    $(document).ready(function () {
      $("#git-branches-grids").on("click", ".grid_button", function () {
        var branch_name = $(this).attr("id");
        console.log("Git branch selected: " + branch_name);
        appstore.setSharedDataForKey("git-branch", branch_name);
        // Go to next page
        appstore.viewNextPage();
      });
    });
  },
  "",
  () => {}, // left button event listener, do nothing
  "",
  () => {}, // right button event listener, do nothing
  "Back",
  () => {
    // center button event listener, go back to previous page
    appstore.viewPreviousPage();
  }
);

// Third page - show all published train images
appstore.addPage(
  "Published Train Images",
  () => {
    // on load event listener
    // enable the buttons
    appstore.enableCenterButton();
    $("#train-images-grids").empty();
    const branchName = appstore.getSharedDataForKey("git-branch");
    const trainStore = appstore.getSharedDataForKey("train-store");
    $("#appstore-loading-gif").show();
    apiService
      .showAllTrainImages(trainStore, branchName)
      .then((response) => {
        $("#appstore-loading-gif").hide();
        $("#train_branch_name > p > span").text(branchName);
        if (response.length === 0) {
          $("#no_train_image_div").css("display", "inline");
        } else {
          $("#no_train_image_div").css("display", "none");
          for (var i = 0; i < response.length; i++) {
            var image_grid =
              '<div class="grid_cols"><ul class="grid_img"><li class="grid_header">';
            image_grid += response[i];
            image_grid +=
              '</li><li class="grid_grey"><input type="submit" id="';
            image_grid += response[i];
            image_grid +=
              '" class="grid_button" value="Know More" /></li></ul></div>';
            $("#train-images-grids").append(image_grid);
          }
        }
      })
      .catch((error) => {
        $("#appstore-loading-gif").hide();
        alert(error.message);
      });
    //div.train-images-grids div.grid_cols ul.grid_img li.grid_grey #Breast_Cancer_Usecase
    $(document).ready(function () {
      $("#train-images-grids").on("click", ".grid_button", function () {
        var title_name = $(this).attr("id");
        console.log("Train image selected: " + title_name);
        appstore.setSharedDataForKey("project-name", title_name);
        // Go to next page
        const trainStore = appstore.getSharedDataForKey("train-store");
        if (trainStore === "incremental-learning") {
          appstore.viewNextPage(appstore.getCurrentPageNumber() + 2);
        } else {
          appstore.viewNextPage();
        }
      });
    });
  },
  "",
  () => {}, // left button event listener, do nothing
  "",
  () => {}, // right button event listener, do nothing
  "Back",
  () => {
    appstore.viewPreviousPage();
  } // center button event listener
);

appstore.addPage(
  "Select Train Image",
  () => {
    appstore.enableRightButton();
    $("#train-content-grids").empty();
    const branchName = appstore.getSharedDataForKey("git-branch");
    const trainStore = appstore.getSharedDataForKey("train-store");
    const projectName = appstore.getSharedDataForKey("project-name");
    $("#appstore-loading-gif").show();
    apiService
      .getFolderContents(trainStore, branchName, projectName)
      .then((response) => {
        $("#appstore-loading-gif").hide();
        $("#train_project_content > p > #train_content_project").text(
          projectName
        );
        $("#train_project_content > p > #train_content_branch").text(
          branchName
        );
        if (response.length === 0) {
          $("#no_train_content_div").css("display", "inline");
        } else {
          $("#no_train_content_div").css("display", "none");
          for (let i = 0; i < response.length; i++) {
            let image_grid =
              '<div class="grid_cols"><ul class="grid_img"><li class="grid_header">';
            image_grid += response[i];
            image_grid +=
              '</li><li class="grid_grey"><input type="submit" id="';
            image_grid += response[i];
            image_grid +=
              '" class="grid_button" value="Know More" /></li></ul></div>';
            $("#train-content-grids").append(image_grid);
          }
        }
      })
      .catch((error) => {
        $("#appstore-loading-gif").hide();
        alert(error.message);
      });

    $(document).ready(function () {
      $("#train-content-grids").on("click", ".grid_button", function () {
        const imageType = $(this).attr("id");
        console.log("Federated Train image type selected: " + imageType);
        appstore.setSharedDataForKey("image-type", imageType);
        // Go to next page
        appstore.viewNextPage();
      });
    });
  },
  "",
  () => {}, // left button event listener, do nothing
  "",
  () => {},
  "Back",
  () => {
    appstore.viewPreviousPage();
  }
);

// Fourth page - show train image specific information
appstore.addPage(
  "Train Image Details",
  () => {
    // on load event listener
    appstore.enableRightButton();
    appstore.enableCenterButton();
    $("#image_connection_params").empty();
    $("#image_metadata").empty();
    $("#image_feedback").empty();
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].addEventListener("click", collapsibleHandler, true);
    }
    const projectName = appstore.getSharedDataForKey("project-name");
    const branchName = appstore.getSharedDataForKey("git-branch");
    const imageType = appstore.getSharedDataForKey("image-type");
    const trainStore = appstore.getSharedDataForKey("train-store");
    var projectBranchObj = new Object();
    projectBranchObj.branch_name = branchName;
    projectBranchObj.project_name = projectName;
    projectBranchObj.train_store = trainStore;
    projectBranchObj.image_type = imageType;
    $("#appstore-loading-gif").show();
    apiService
      .fetchSpecificTrainDetails(projectBranchObj)
      .then((response) => {
        $("#appstore-loading-gif").hide();
        $("#train_project_name > p > #ofc_project").text(response.project_name);
        $("#train_project_name > p > #ofc_branch").text(response.branch_name);
        $("#train_project_name > #train_project_url").text(
          response.project_url
        );
        $("#train_project_url").attr("href", response.project_url);
        appstore.setSharedDataForKey("member-name", response.member_name);
        appstore.setSharedDataForKey(
          "approval-permission",
          response.approval_permission
        );

        var connection_params = response.connection_params;
        $("#image_connection_params").empty();
        var content =
          "<thead><tr><th>Environment Label</th><th>Data Type</th><th>Required?</th></tr></thead><tbody>";
        for (var i = 0; i < connection_params.length; i++) {
          content +=
            '<tr><td id="t_' +
            [i] +
            '">' +
            connection_params[i]["name"] +
            "</td>";
          content += "<td>" + connection_params[i]["type"] + "</td>";
          content += "<td>" + connection_params[i]["required"] + "</td></tr>";
        }
        content += "</tbody>";
        $("#image_connection_params").append(content);

        var metadata_pht = response.metadata.additional_info;
        $("#image_metadata").empty();
        var mcontent =
          "<thead><tr><th>Property</th><th>Value</th></tr></thead><tbody>";
        mcontent +=
          "<tr><td>project_name</td><td>" +
          response.metadata.project_name +
          "</td></tr>";
        mcontent +=
          "<tr><td>project_description</td><td>" +
          response.metadata.project_description +
          "</td></tr>";
        mcontent +=
          "<tr><td>project_type</td><td>" +
          response.metadata.project_type +
          "</td></tr>";
        $.each(metadata_pht, function (key, value) {
          mcontent += "<tr><td>" + key + "</td><td>" + value + "</td></tr>";
        });
        mcontent += "</tbody>";
        $("#image_metadata").append(mcontent);

        var feedback_pht = response.feedback;
        $("#image_feedback").empty();

        var sum = 0;
        var rcontent =
          "<thead><tr><th>User and Time Details</th><th>User Feedback</th></tr></thead><tbody>";
        for (var i = 0; i < feedback_pht.length; i++) {
          rcontent +=
            "<tr><td>" +
            feedback_pht[i]["member_name"] +
            "<br>" +
            feedback_pht[i]["date_time"] +
            "</td>";
          rcontent +=
            "<td>" +
            feedback_pht[i]["rating"] +
            "/5<br>" +
            feedback_pht[i]["comment"] +
            "</td></tr>";
          sum += parseInt(feedback_pht[i]["rating"]);
        }
        rcontent += "</tbody>";
        $("#image_feedback").append(rcontent);
        var totalRatings = feedback_pht.length == 0 ? 1 : feedback_pht.length;
        var avg_rating = (sum / totalRatings).toFixed(1);
        $("#train_project_name > p > #train_rating").text(avg_rating);
        if (
          response.branch_name === "main" ||
          response.feedback_permission === false
        ) {
          appstore.disableRightButton();
        }
        if (response.approval_permission && avg_rating >= 4) {
          $("#approve-train-section").show();
        } else {
          $("#approve-train-section").hide();
        }

        // On clicking Approve button, go the MR page
        $("#approve-train").click(function () {
          appstore.setSharedDataForKey("approval-flow", true);
          appstore.viewNextPage();
        });
      })
      .catch((error) => {
        $("#appstore-loading-gif").hide();
        alert(error.message);
      });
    callHelpModalUtility();
  },
  "",
  () => {}, // left button event listener, do nothing
  "Give Feedback",
  () => {
    // right button event listener
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].removeEventListener("click", collapsibleHandler, true);
    }
    appstore.setSharedDataForKey("approval-flow", false);
    appstore.viewNextPage();
  },
  "Back",
  () => {
    // center button event listener
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].removeEventListener("click", collapsibleHandler, true);
    }
    const trainStore = appstore.getSharedDataForKey("train-store");
    if (trainStore === "incremental-learning") {
      appstore.viewPreviousPage(appstore.getCurrentPageNumber() - 2);
    } else {
      appstore.viewPreviousPage();
    }
  }
);

// Fifth page - user feedback page
appstore.addPage(
  "Train Image User Ratings and Feedback",
  () => {
    // on load event listener
    const approvalFlow = appstore.getSharedDataForKey("approval-flow");
    if (approvalFlow) {
      appstore.viewNextPage();
    } else {
      appstore.enableRightButton();
      appstore.enableCenterButton();
      const memberName = appstore.getSharedDataForKey("member-name");
      $("#logged_in_user").text(memberName);
      $("#user_comment").val("");
    }
  },
  "",
  () => {}, // left button event listener, do nothing
  "Save Feedback",
  () => {
    // right button event listener
    $("#save-feedback-loading").show();
    const memberName = appstore.getSharedDataForKey("member-name");
    const projectName = appstore.getSharedDataForKey("project-name");
    const branchName = appstore.getSharedDataForKey("git-branch");
    const imageType = appstore.getSharedDataForKey("image-type");
    const trainStore = appstore.getSharedDataForKey("train-store");
    var userFeedbackObj = new Object();
    userFeedbackObj.comment = $("#user_comment").val();
    userFeedbackObj.member_name = memberName;
    userFeedbackObj.project_name = projectName;
    userFeedbackObj.branch_name = branchName;
    userFeedbackObj.image_type = imageType;
    userFeedbackObj.train_store = trainStore;
    userFeedbackObj.rating = parseInt($("input[name=rating]:checked").val());
    apiService
      .saveUserFeedback(userFeedbackObj)
      .then((response) => {
        appstore.enableRightButton();
        // hide the loading gif
        $("#save-feedback-loading").hide();
        // view the next page
        appstore.viewPreviousPage();
      })
      .catch((error) => {
        $("#save-feedback-loading").hide();
        alert(error.message);
      });
  },
  "Back",
  () => {
    // center button event listener
    appstore.viewPreviousPage();
  }
);

// Sixth page - create GitLab Merge Request page
appstore.addPage(
  "Train Image Approval Process",
  () => {
    // on load event listener
    appstore.enableRightButton();
    appstore.enableCenterButton();
    const branchName = appstore.getSharedDataForKey("git-branch");
    const projectName = appstore.getSharedDataForKey("project-name");
    $("#train_project_name > p > #ofc_project").text(projectName);
    $("#train_project_name > p > #ofc_branch").text(branchName);
    $("#train_project_name > p > #source_to_dest_branch").text(
      branchName + "  =>  main"
    );
    $("#mr_title").val("");
  },
  "",
  () => {}, // left button event listener, do nothing
  "Create MR",
  () => {
    // right button event listener
    var mr_title = $("#mr_title").val();
    appstore.setSharedDataForKey("mr-title", mr_title);
    appstore.viewNextPage();
  },
  "Back",
  () => {
    // center button event listener
    appstore.setSharedDataForKey("approval-flow", false);
    appstore.viewPreviousPage();
  }
);

// Seventh page - GitLab Merge Request details and final approval page
appstore.addPage(
  "Train Image Merge Request Details",
  () => {
    // on load event listener
    appstore.enableRightButton();
    appstore.disableCenterButton();
    $("#git-mr-loading").show();
    const branchName = appstore.getSharedDataForKey("git-branch");
    const mrTitle = appstore.getSharedDataForKey("mr-title");
    const trainStore = appstore.getSharedDataForKey("train-store");
    var mergeRequestObj = new Object();
    mergeRequestObj.mr_title = mrTitle;
    mergeRequestObj.branch_name = branchName;
    mergeRequestObj.train_store = trainStore;
    apiService
      .createGitMergeRequestAfterApproval(mergeRequestObj)
      .then((response) => {
        $("#git_mr_table").empty();
        var content =
          '<tbody><tr><td>MR URL</td><td><a href="' +
          response.mr_url +
          '" target="_blank" rel="noopener noreferrer">' +
          response.mr_url +
          "</a></td></tr>";
        content +=
          "<tr><td>MR Created At</td><td>" +
          response.mr_created_at +
          "</td></tr>";
        content +=
          "<tr><td>MR Title</td><td>" + response.mr_title + "</td></tr>";
        content +=
          "<tr><td>MR State</td><td>" + response.mr_state + "</td></tr>";
        content +=
          "<tr><td>MR Source Branch</td><td>" +
          response.mr_source_branch +
          "</td></tr>";
        content +=
          "<tr><td>MR Target Branch</td><td>" +
          response.mr_target_branch +
          "</td></tr>";
        content +=
          '<tr><td>MR Pipeline URL</td><td><a href="' +
          response.pipeline_url +
          '" target="_blank" rel="noopener noreferrer">' +
          response.pipeline_url +
          "</a></td></tr>";
        content += "</tbody>";
        $("#git_mr_table").append(content);
        appstore.setSharedDataForKey("mr-iid", response.mr_iid);
        $("#git-mr-loading").hide();
      })
      .catch((error) => {
        $("#git-mr-loading").hide();
        alert(error.message);
      });
  },
  "",
  () => {}, // left button event listener, do nothing
  "Merge MR",
  () => {
    // right button event listener
    appstore.viewNextPage();
  },
  "",
  () => {} // center button event listener, do nothing
);

// Eighth page - final page
appstore.addPage(
  "Train Image Approval Completed!!!",
  () => {
    // on load event listener
    appstore.disableRightButton();
    appstore.disableCenterButton();
    $("#git-mr-loading").show();
    const mrIID = appstore.getSharedDataForKey("mr-iid");
    const trainStore = appstore.getSharedDataForKey("train-store");
    var pushRequestObj = new Object();
    pushRequestObj.mr_iid = mrIID;
    pushRequestObj.train_store = trainStore;
    apiService
      .pushGitMergeRequest(pushRequestObj)
      .then((response) => {
        $("#final_details > p > #mr_time").text(response.mr_push_created_at);
        $("#final_details > p > #mr_url").text(response.mr_push_url);
        $("#mr_url").attr("href", response.mr_push_url);
        $("#git-mr-loading").hide();
      })
      .catch((error) => {
        $("#git-mr-loading").hide();
        alert(error.message);
      });
  },
  "",
  () => {}, // left button event listener, do nothing
  "",
  () => {}, // right button event listener, do nothing
  "",
  () => {} // center button event listener, do nothing
);

appstore.showAppstore();

const keycloak = new Keycloak({
  realm: KC_REALM,
  url: KC_URL,
  clientId: KC_CLIENT_ID,
});

function initKeycloak() {
  // Check if it's local development mode
  const isLocalMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalMode) {
    console.log("Local development mode detected - bypassing Keycloak authentication");
    // Set fake credentials for local development
    appstore.setSharedDataForKey("token", "dev-local-token-12345");
    appstore.setSharedDataForKey("username", "local-dev-user");
    appstore.setSharedDataForKey("gitlab-authenticated", true);
    appstore.setSharedDataForKey("pat", "dev-local-pat");
    
    // Show local mode indicator
    showLocalModeIndicator();
    return;
  }
  
  keycloak
    .init({
      onLoad: "login-required",
    })
    .then(function (authenticated) {
      console.log("Authenticated: " + authenticated);
      if (authenticated) {
        appstore.setSharedDataForKey("token", keycloak.token);
        appstore.setSharedDataForKey(
          "username",
          keycloak.tokenParsed.preferred_username
        );
      }
    })
    .catch(function (e) {
      console.log("failed to initialize", e);
    });

  keycloak.onTokenExpired = () => {
    console.log("Token expired");
    keycloak
      .updateToken(30)
      .then(function (refreshed) {
        if (refreshed) {
          console.log("Token refreshed");
          appstore.setSharedDataForKey("token", keycloak.token);
          appstore.setSharedDataForKey(
            "username",
            keycloak.tokenParsed.preferred_username
          );
        }
      })
      .catch(function (e) {
        console.log("Failed to refresh token", e);
      });
  };

  keycloak;
}

function showLocalModeIndicator() {
  // Create and show local mode banner
  const banner = document.createElement('div');
  banner.id = 'local-mode-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #e8f5e8;
    border-bottom: 2px solid #4caf50;
    color: #2e7d32;
    text-align: center;
    padding: 10px;
    font-weight: bold;
    z-index: 10000;
    animation: slideDown 0.5s ease-out;
  `;
  banner.innerHTML = `
    🚀 本地开发模式 - Local Development Mode - 已自动跳过Keycloak认证
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
    </style>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Auto-hide banner after 5 seconds
  setTimeout(() => {
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 1s';
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 1000);
  }, 5000);
}

export function getCredentials() {
  return {
    token: appstore.getSharedDataForKey("token"),
    username: appstore.getSharedDataForKey("username"),
    pat: appstore.getSharedDataForKey("pat"),
  };
}

initKeycloak();

$("#revoke-token-btn").on("click", function () {
  apiService
    .revokeGitlabToken()
    .then((response) => {
      const response_status_code = response.status_code;
      if (response_status_code === 200) {
        console.log("User token revoked");
        appstore.setSharedDataForKey("gitlab-authenticated", false);
        appstore.setSharedDataForKey("pat", null);
        location.reload();
      } else {
        alert(response.message);
      }
    })
    .catch((error) => console.log(`Error logging off user: ${error.message}`));
});

$("#logout-btn").on("click", function () {
  appstore.setSharedDataForKey("gitlab-authenticated", false);
  appstore.setSharedDataForKey("pat", null);
  appstore.setSharedDataForKey("token", null);
  appstore.setSharedDataForKey("username", null);
  keycloak.logout();
});
