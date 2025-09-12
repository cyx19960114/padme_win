import * as apiService from "./api-service.js";
import Wizard from "./wizard.js";
import { KC_REALM, KC_CLIENT_ID, KC_URL, GITLAB_URL } from "./constants.js";

const OFFICIAL_TRAIN_STORE = {
  URL: GITLAB_URL,
  INCREMENTAL_REPO_ID: 35,
  FEDERATED_REPO_ID: 36,
};

const TRAIN_TYPES = {
  INCREMENTAL: "incremental",
  FEDERATED_LEARNING: "federated-learning",
  FEDERATED_AGGREGATION: "federated-aggregation"
}

// Wizard pages section
const wizard = new Wizard();

// Gitlab authentication page (modified for local development)
wizard.addPage(
  "Gitlab Authentication",
  () => {
    // 检查是否为开发模式（通过检查域名是否为localhost）
    const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevMode) {
      // 开发模式：直接跳过GitLab认证
      console.log("Development mode detected - skipping GitLab authentication");
      wizard.setSharedDataForKey("gitlab-authenticated", true);
      wizard.setSharedDataForKey("pat", "dev-local-token");
      // 延迟1秒后自动跳转，让用户看到跳过消息
      setTimeout(() => {
        wizard.viewNextPage();
      }, 1000);
      
      // 显示跳过消息
      $("#auth-loading").hide();
      $(".wizard__content").html(`
        <div style="text-align: center; padding: 40px;">
          <h3>🚀 本地开发模式</h3>
          <p>检测到本地环境，正在跳过GitLab身份验证...</p>
          <p>即将自动进入训练任务创建向导</p>
          <div class="loading-spinner" style="margin: 20px auto; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `);
      return;
    }

    // 生产模式：原始GitLab认证逻辑
    // disable the buttons
    wizard.disableRightButton();
    wizard.disableLeftButton();
    wizard.disableCenterButton();

    if (wizard.getSharedDataForKey("gitlab-authenticated")) {
      wizard.viewNextPage();
    } else {
      $("#auth-loading").show();
      apiService.verifyUserGitlabCredentials().then((pat) => {
        if (pat) {
          $("#auth-loading").hide();
          wizard.setSharedDataForKey("gitlab-authenticated", true);
          wizard.setSharedDataForKey("pat", pat);
          wizard.viewNextPage();
        } else {
          $("#auth-loading").hide();
          wizard.setSharedDataForKey("gitlab-authenticated", false);
          wizard.setSharedDataForKey("pat", null);
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
            wizard.setSharedDataForKey("gitlab-authenticated", true);
            wizard.setSharedDataForKey("pat", authObj.pat);
            wizard.viewNextPage();
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
  () => { }, // left button event listener,  do nothing
  "",
  () => { }, // right button event listener, do nothing
  "",
  () => { } // center button event listener, do nothing
);
// First page - Select type of train to create
wizard.addPage(
  "Train Type Selection",
  () => {
    wizard.enableRightButton();
    callHelpModalUtility();
  },
  "",
  () => { },
  "Next",
  () => {
    const trainType = $("#train-type-form input:checked").val();
    wizard.setSharedDataForKey("train-type", trainType);
    wizard.viewNextPage();
  },
  "",
  () => { }
);

// Second page - import a data analysis task page
wizard.addPage(
  "Import Data Analysis Task",
  () => {
    // on load event listener
    wizard.enableLeftButton();
    // disable the right button until a file is uploaded
    wizard.disableRightButton();
    callHelpModalUtility();
    // logic once file is clicked in the form
    $("#import-task-file").change(function () {
      // show the uploaded filename in the ui
      const filename = $("#import-task-file")[0].files[0].name;
      $("#import-task-filename").text(filename);
      // enable the right button
      wizard.enableRightButton();
    });
  },
  "Cancel",
  () => {
    wizard.viewPreviousPage();
  }, // left button event listener, go back to first page
  "Next",
  () => {
    // right button event listener
    // disable the right button
    wizard.disableRightButton();
    // show loading gif
    $("#import-task-loading").show();
    // get the file from the input
    const file = $("#import-task-file")[0].files[0];
    const trainType = wizard.getSharedDataForKey("train-type");
    // call the api to upload the analysis task
    apiService
      .uploadDataAnalysisTask(file, trainType)
      .then((response) => {
        console.log("Uploaded Data Analysis Task");
        console.log("Train ID: " + response.train_id);
        // store the train id in shared data
        wizard.setSharedDataForKey("train-id", response.train_id);
        // enable the right button
        wizard.enableRightButton();
        // hide the loading gif
        $("#import-task-loading").hide();
        // view the next page
        wizard.viewNextPage();
      })
      .catch((error) => {
        // hide the loading gif
        $("#import-task-loading").hide();
        $("#import-task-error")
          .html(error.message)
          .addClass("page__import-task-error");
        // enable the right button
        wizard.enableRightButton();
      });
  },
  "",
  () => { } // center button event listener, do nothing
);

// Third page - import requirements file page
wizard.addPage(
  "Import Requirements/Packages File",
  () => {
    // on load event listener
    // disable the right button until a file is uploaded
    wizard.disableRightButton();
    // logic once file is clicked in the form
    $("#import-req-file").change(function () {
      // show the uploaded filename in the ui
      const filename = $("#import-req-file")[0].files[0].name;
      $("#import-req-filename").text(filename);
      // enable the right button
      wizard.enableRightButton();
    });
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // disable the right button
    wizard.disableRightButton();
    // show loading gif
    $("#import-req-loading").show();
    // get the file from the input
    const file = $("#import-req-file")[0].files[0];
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");
    // call the api to upload the requirements file
    apiService
      .uploadReqFile(file, trainId)
      .then((response) => {
        console.log("Uploaded Requirements File");
        // enable the right button
        wizard.enableRightButton();
        // hide the loading gif
        $("#import-req-loading").hide();
        // view the next page
        wizard.viewNextPage();
      })
      .catch((error) => {
        // hide the loading gif
        $("#import-req-loading").hide();
        $("#import-req-error")
          .html(error.message)
          .addClass("page__import-req-error");
        // enable the right button
        wizard.enableRightButton();
      });
  },
  "",
  () => { } // center button event listener, do nothing
);

// Fourth page - connection parameters page
wizard.addPage(
  "PHT - Train and Station Connection Parameters",
  () => {
    // on load event listener
    // If aggregation train, skip this page
    if (wizard.getSharedDataForKey("train-type") === TRAIN_TYPES.FEDERATED_AGGREGATION) {
      wizard.viewNextPage();
      return;
    }
    wizard.enableRightButton();
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .getConnectionCredentials(trainId)
      .then((response) => {
        var connection_params = response.connection_params;
        $("#param_table").empty();
        var content =
          '<thead><tr><th style="padding-left: 25px; padding-bottom: 10px;">Connection Variable</th>';
        content +=
          '<th style="padding-left: 25px; padding-bottom: 10px;">Data Type</th>';
        content +=
          '<th style="padding-bottom: 10px;">Required?</th></tr></thead><tbody class="add_new_row">';
        var params_count = connection_params.length;
        if (connection_params.length === 0) {
          params_count = 1;
        }
        for (var i = 0; i < params_count; i++) {
          content +=
            '<tr><td><input type="text" id="mlabel' +
            [i] +
            '" name="mlabel' +
            [i] +
            '" class="mlabel' +
            [i] +
            '" list="env-vars-list" placeholder="Connection Variable">';
          content += getAllEnvVariables();
          content += "</td>";
          content +=
            '<td><input type="text" id="mtype' +
            [i] +
            '" name="mtype' +
            [i] +
            '" class="mtype' +
            [i] +
            '" placeholder="Data Type"></td>';
          content +=
            '<td><input type="checkbox" id="mreq' +
            [i] +
            '" name="mreq' +
            [i] +
            '" class="mreq' +
            [i] +
            '" value="Required"></td></tr>';
        }
        content += "</tbody>";
        $("#param_table").append(content);
        if (connection_params.length !== 0) {
          for (var i = 0; i < params_count; i++) {
            $("#mlabel" + [i]).val(connection_params[i]["name"]);
            $("#mtype" + [i]).val(connection_params[i]["type"]);
            if (connection_params[i]["required"]) {
              $("#mreq" + [i]).prop("checked", true);
            } else {
              $("#mreq" + [i]).prop("checked", false);
            }
          }
        }

        $("#insert-more").click(function () {
          $("#param_table").each(function () {
            var tds = "<tr>";
            jQuery.each($("tr:last td", this), function () {
              tds += "<td>" + $(this).html() + "</td>";
            });
            tds += "</tr>";
            if ($(".add_new_row", this).length > 0) {
              $(".add_new_row", this).append(tds);
            } else {
              $(this).append(tds);
            }
          });
        });
      })
      .catch((error) => alert(error.message));
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");

    var connection_params = [];
    $("#param_table > tbody > tr").each(function () {
      var $tds = $(this).find("td");
      var $requiredStatus = $tds
        .eq(2)
        .find("input[type='checkbox']")
        .prop("checked");
      var $labelName = $tds.eq(0).find("input").val();
      var $typeName = $tds.eq(1).find("input").val();

      var param1 = {
        name: $labelName,
        type: $typeName,
        required: $requiredStatus,
      };
      connection_params.push(param1);
    });

    var connectionParamsObj = new Object();
    connectionParamsObj.connection_params = connection_params;
    apiService
      .saveConnectionCredentials(connectionParamsObj, trainId)
      .then((response) => {
        console.log("Saved new connection parameters");
        // enable the right button
        wizard.enableRightButton();
        wizard.viewNextPage();
      })
      .catch((error) => alert(error.message));
  },
  "",
  () => { } // center button event listener, do nothing
);

// Fifth page - import a dockerfile or create from standard template page
wizard.addPage(
  "Import Dockerfile",
  () => {
    // on load event listener
    // logic once file is clicked in the form
    $("#import-dockerfile-file").val(null);
    $("#import-dockerfile-filename").empty();
    $("#import-dockerfile-file").change(function () {
      // show the uploaded filename in the ui
      const filename = $("#import-dockerfile-file")[0].files[0].name;
      $("#import-dockerfile-filename").text(filename);
      // store the user decision in shared data
      wizard.setSharedDataForKey("custom-file", true);
      // enable the right button
      wizard.enableRightButton();
    });
    $("#std_template_docker").change(function () {
      // store the user decision in shared data
      wizard.setSharedDataForKey("custom-file", false);
      wizard.enableRightButton();
    });
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // disable the right button
    wizard.disableRightButton();
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");
    // get the dockerfile user decision from wizard shared dictionary
    const flag = wizard.getSharedDataForKey("custom-file");
    if (flag) {
      // show loading gif
      $("#import-dockerfile-loading").show();
      // get the file from the input
      const file = $("#import-dockerfile-file")[0].files[0];
      apiService
        .uploadDockerfile(file, trainId)
        .then((response) => {
          console.log("Uploaded Dockerfile");
          // enable the right button
          wizard.enableRightButton();
          // hide the loading gif
          $("#import-dockerfile-loading").hide();
          // view the next page
          wizard.viewNextPage();
        })
        .catch((error) => {
          // hide the loading gif
          $("#import-dockerfile-loading").hide();
          $("#import-dockerfile-error")
            .html(error.message)
            .addClass("page__import-dockerfile-error");
          // enable the right button
          wizard.enableRightButton();
        });
    } else {
      wizard.viewNextPage();
    }
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Sixth page - selecting the entry point for Dockerfile
wizard.addPage(
  "Analytics Task Entry Point Selection",
  () => {
    // on load event listener
    wizard.disableRightButton();
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .getEntryPointFiles(trainId)
      .then((response) => {
        let radioHTML = "";
        $.each(response, function (index, value) {
          radioHTML +=
            '<label><input type="radio" name="radio_group" value="' +
            value +
            '"> ' +
            value +
            "</label><br>";
        });
        $("#radio-group").html(radioHTML);
      })
      .catch((error) => alert(error.message));
    wizard.enableRightButton();
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    let python_file_selected = $("input[name='radio_group']:checked").val();
    wizard.setSharedDataForKey("python-main-file", python_file_selected);
    console.log(python_file_selected);
    wizard.viewNextPage();
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Seventh page - display dockerfile page
wizard.addPage(
  "Standard Dockerfile from Template",
  () => {
    // on load event listener
    wizard.enableRightButton();
    const trainId = wizard.getSharedDataForKey("train-id");
    const pythonMainFile = wizard.getSharedDataForKey("python-main-file");
    const customFileFlag = wizard.getSharedDataForKey("custom-file");
    apiService
      .getDockerfileContent(trainId, pythonMainFile, customFileFlag)
      .then((response) => {
        console.log("Fetched Dockerfile content");
        // enable the right button
        wizard.enableRightButton();
        $("#std-dockerfile").val(response.docker_file_content);
      })
      .catch((error) => alert(error.message));
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");
    var stdDockerfileObj = new Object();
    stdDockerfileObj.docker_file_content = $("#std-dockerfile").val();
    apiService
      .saveDockerfileContent(stdDockerfileObj, trainId)
      .then((response) => {
        console.log("Standard Dockerfile saved in the system");
        wizard.enableRightButton();
        wizard.viewNextPage();
      })
      .catch((error) => alert(error.message));
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Eighth page - metadata page
wizard.addPage(
  "PHT - Metadata",
  () => {
    // on load event listener
    wizard.enableRightButton();
    const trainId = wizard.getSharedDataForKey("train-id");
    callHelpModalUtility();
    apiService
      .getMetadata(trainId)
      .then((response) => {
        $("#pname").val(response.project_name);
        $("#pdesc").val(response.project_description);
        $("#git_link_metadata").attr("href", response.project_url);
        $('input[name=ptype][value="' + response.project_type + '"]').prop(
          "checked",
          true
        );

        var addn_metadata = response.additional_info;
        var addn_metadata_length = Object.keys(addn_metadata).length;
        $("#a_table").empty();
        if (Object.keys(addn_metadata).length === 0) {
          addn_metadata_length = 1;
        }
        var content = '<tbody class="a_info_class">';
        for (var i = 0; i < addn_metadata_length; i++) {
          content +=
            '<tr><td><input type="text" id="a' +
            [i] +
            '" name="a' +
            [i] +
            '" class="a' +
            [i] +
            '" placeholder="metadata_key"></td>';
          content +=
            '<td><input type="text" id="b' +
            [i] +
            '" name="b' +
            [i] +
            '" class="b' +
            [i] +
            '" placeholder="metadata_value"></td></tr>';
        }
        content += "</tbody>";
        $("#a_table").append(content);

        var i = 0;
        if (addn_metadata_length !== 0) {
          for (var key of Object.keys(addn_metadata)) {
            $("#a" + i).val(key);
            $("#b" + i).val(addn_metadata[key]);
            i = i + 1;
          }
        }

        $("#insert-more").click(function () {
          $("#a_table").each(function () {
            var tds = "<tr>";
            jQuery.each($("tr:last td", this), function () {
              tds += "<td>" + $(this).html() + "</td>";
            });
            tds += "</tr>";
            if ($(".a_info_class", this).length > 0) {
              $(".a_info_class", this).append(tds);
            } else {
              $(this).append(tds);
            }
          });
        });
        $("input[name=ptype]").click(function () {
          if ($(this).attr("value") === "Public") {
            $(".optional_row").show();
          }
          if ($(this).attr("value") === "Private") {
            $(".optional_row").hide();
          }
        });
      })
      .catch((error) => alert(error.message));
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");
    var metadataObj = new Object();
    var project_name_re = /^\S+$/;
    metadataObj.project_name = $("#pname").val();
    metadataObj.project_description = $("#pdesc").val();
    metadataObj.project_type = $("input[name=ptype]:checked").val();
    if (metadataObj.project_type === "Private") {
      metadataObj.project_url = "";
      wizard.setSharedDataForKey("private-flow", true);
    } else {
      metadataObj.project_url = $("#git_link_metadata").attr("href");
      wizard.setSharedDataForKey("private-flow", false);
    }
    var metadataObjAddn = new Object();
    metadataObjAddn["train_type"] = wizard.getSharedDataForKey("train-type");
    if (project_name_re.test(metadataObj.project_name)) {
      $("#a_table > tbody > tr").each(function () {
        var $tds = $(this).find("td");
        var metadataKey = $tds.eq(0).find("input").val();
        var metadataValue = $tds.eq(1).find("input").val();

        metadataObjAddn[metadataKey] = metadataValue;
      });
      metadataObj.additional_info = metadataObjAddn;
      apiService
        .saveMetadata(metadataObj, trainId)
        .then((response) => {
          console.log("Saved new metadata");
          // enable the right button
          wizard.enableRightButton();
          wizard.viewNextPage();
        })
        .catch((error) => alert(error.message));
    } else {
      alert(
        "No whitespaces are allowed in the project name for the repository. Please modify the name!!!"
      );
    }
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Ninth Page- GitLab access parameters
wizard.addPage(
  "GitLab Access Parameters",
  () => {
    // on load event listener
    wizard.enableRightButton();
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .getGitInfoParams(trainId)
      .then((response) => {
        const private_flow = wizard.getSharedDataForKey("private-flow");
        const trainType = wizard.getSharedDataForKey("train-type");
        if (!private_flow) {
          $(".private_flow_instructions").hide();
          $(".official_flow_instructions").show();
          $("#git_url").val(OFFICIAL_TRAIN_STORE.URL);
          if (
            trainType === "federated-learning" ||
            trainType === "federated-aggregation"
          ) {
            $("#pid").val(OFFICIAL_TRAIN_STORE.FEDERATED_REPO_ID);
          } else {
            $("#pid").val(OFFICIAL_TRAIN_STORE.INCREMENTAL_REPO_ID);
          }
          $("#git_url").prop("readonly", true);
          $("#pid").prop("readonly", true);
          const pat = wizard.getSharedDataForKey("pat");
          $("#a_token").val(pat);
        } else {
          $(".private_flow_instructions").show();
          $(".official_flow_instructions").hide();
          $("#git_url").val(response.git_url);
          $("#pid").val(response.project_id);
          $("#a_token").val(response.access_token);
          $("#git_url").prop("readonly", false);
          $("#pid").prop("readonly", false);
        }
      })
      .catch((error) => alert(error.message));
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    // right button event listener
    // get the train id from wizard shared dictionary
    const trainId = wizard.getSharedDataForKey("train-id");
    var privateGitInfoObj = new Object();
    privateGitInfoObj.git_url = $("#git_url").val();
    privateGitInfoObj.project_id = $("#pid").val();
    privateGitInfoObj.access_token = $("#a_token").val();
    if (
      privateGitInfoObj.project_id === "" ||
      privateGitInfoObj.access_token === "" ||
      privateGitInfoObj.git_url === ""
    ) {
      alert("Please fill all required fields!!!");
    } else {
      apiService
        .savePrivateGitInfo(privateGitInfoObj, trainId)
        .then((response) => {
          console.log("Info saved in the system");
          wizard.enableRightButton();
          wizard.viewNextPage();
        })
        .catch((error) => alert(error.message));
    }
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Tenth page - summary page
wizard.addPage(
  "PHT - Train Image Summary",
  () => {
    // on load event listener
    wizard.enableRightButton();
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].addEventListener("click", collapsibleHandler, true);
    }

    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .getTrainSummary(trainId)
      .then((response) => {
        $("#pht_files").empty();
        var output = "<ul>";
        $.each(response.data_files, function (key, value) {
          output += "<li>" + value + "</li>";
        });
        output += "</ul>";
        $("#pht_files").append(output);

        var connection_params = response.connection_params;
        $("#pht_connection_params").empty();
        var content =
          "<thead><tr><th>Connection Variable</th><th>Data Type</th><th>Required?</th></tr></thead><tbody>";
        for (var i = 0; i < connection_params.length; i++) {
          content +=
            '<tr><td id="t_' +
            [i] +
            '">' +
            connection_params[i]["name"] +
            "</td>";
          content += "<td>" + connection_params[i]["type"] + "</td>";
          content += "<td>" + connection_params[i]["required"] + "</td>";
        }
        content += "</tbody>";
        $("#pht_connection_params").append(content);

        var metadata_pht = response.metadata.additional_info;
        $("#pht_metadata").empty();
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
        $("#pht_metadata").append(mcontent);
      })
      .catch((error) => alert(error.message));
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].removeEventListener("click", collapsibleHandler, true);
    }
    wizard.enableRightButton();
    wizard.viewNextPage();
  },
  "Back",
  () => {
    var coll = document.getElementsByClassName("collapsible");
    var j;
    for (j = 0; j < coll.length; j++) {
      coll[j].removeEventListener("click", collapsibleHandler, true);
    }
    wizard.viewPreviousPage();
  } // center button event listener
);

// Eleventh page - create git commit page
wizard.addPage(
  "Create GitLab Commit for Train Image",
  () => {
    // on load event listener
    wizard.enableRightButton(); //git_table
    const trainId = wizard.getSharedDataForKey("train-id");
    const private_flow = wizard.getSharedDataForKey("private-flow");
    if (private_flow) {
      $(".public_git_link").hide();
    } else {
      $(".public_git_link").show();
      const trainType = wizard.getSharedDataForKey("train-type");
      let gitUrl = OFFICIAL_TRAIN_STORE.URL + "padme/";
      if (
        trainType === "federated-learning" ||
        trainType === "federated-aggregation"
      ) {
        gitUrl = gitUrl + "padme-federated-train-depot";
      } else {
        gitUrl = gitUrl + "padme-train-depot";
      }
      $("#git_link").attr("href", gitUrl);
      $("#git_link").text(gitUrl);
    }
    apiService
      .getGitInfo(trainId)
      .then((response) => {
        $("#git_branch").empty();
        for (var i = 0; i < response.length; i++) {
          $("#git_branch").append(
            '<option value="' + response[i] + '">' + response[i] + "</option>"
          );
        }
      })
      .catch((error) => alert(error.message));
    // To populate other data
    apiService
      .getGitInfoParams(trainId)
      .then((response) => {
        $("#commit_message").val(response.commit_message);
        if (response.new_branch) {
          $('input[name="git_branch_new"][value="New"]').prop("checked", true);
          $(".new_branch_row").show();
          $(".existing_branch_row").hide();
          $("#new_branch_name").val(response.new_branch_name);
        } else {
          $('input[name="git_branch_new"][value="New"]').prop("checked", false);
          $(".new_branch_row").hide();
          $(".existing_branch_row").show();
        }
      })
      .catch((error) => alert(error.message));
    $("#git_branch_new").click(function () {
      if ($(this).is(":checked")) {
        $(".new_branch_row").show(300);
        $(".existing_branch_row").hide(200);
      } else {
        $(".new_branch_row").hide(200);
        $(".existing_branch_row").show(300);
      }
    });
  },
  "Cancel",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
        location.reload();
      })
      .catch((error) => alert(error.message));
  }, // left button event listener
  "Next",
  () => {
    wizard.enableRightButton();
    $("#create-commit-loading").show();
    // Save branch and commit message in shared storage
    const trainId = wizard.getSharedDataForKey("train-id");
    var gitCommitBranchObj = new Object();
    gitCommitBranchObj.commit_message = $("#commit_message").val();
    if ($("#git_branch_new").is(":checked")) {
      gitCommitBranchObj.new_branch_name = $("#new_branch_name").val();
      gitCommitBranchObj.new_branch = true;
      gitCommitBranchObj.branch = "";
    } else {
      gitCommitBranchObj.branch = $("#git_branch").find(":selected").text();
      gitCommitBranchObj.new_branch_name = "";
      gitCommitBranchObj.new_branch = false;
    }
    apiService
      .createGitBranchCommitData(gitCommitBranchObj, trainId)
      .then((response) => {
        console.log("Git commit information has been saved!");
        $("#create-commit-loading").hide();
        wizard.viewNextPage();
      })
      .catch((error) => alert(error.message));
  },
  "Back",
  () => {
    wizard.viewPreviousPage();
  } // center button event listener
);

// Twelfth page - show git commit info
wizard.addPage(
  "GitLab Commit Details",
  () => {
    // on load event listener
    wizard.enableRightButton(); //git_table
    $("#git-commit-loading").show();
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .uploadFilesToGit(trainId)
      .then((response) => {
        var commit_response = response;
        $("#git_commit_table").empty();
        var content =
          '<tbody><tr><td>Commit URL</td><td><a href="' +
          response.commit_url +
          '" target="_blank" rel="noopener noreferrer">' +
          response.commit_url +
          "</a></td></tr>";
        content +=
          "<tr><td>Commit Created At</td><td>" +
          response.commit_created_at +
          "</td></tr>";
        content +=
          "<tr><td>Commit Message</td><td>" +
          response.commit_message +
          "</td></tr>";
        content +=
          "<tr><td>Author Name</td><td>" + response.author_name + "</td></tr>";
        content +=
          "<tr><td>Commit SHA</td><td>" + response.commit_sha + "</td></tr>";
        content += "</tbody>";
        $("#git_commit_table").append(content);
        $("#git-commit-loading").hide();
      })
      .catch((error) => {
        $("#git-commit-loading").hide();
        alert(error.message);
      });
  },
  "",
  () => { }, // left button event listener
  "Finish",
  () => {
    const trainId = wizard.getSharedDataForKey("train-id");
    apiService
      .cancelTrainCreation(trainId)
      .then((response) => {
        console.log("Deleted Train");
      })
      .catch((error) => alert(error.message));
    wizard.enableRightButton();
    wizard.viewNextPage();
  },
  "",
  () => { } // center button event listener, do nothing
);

// Thirteenth page - final page
wizard.addPage(
  "Completed!!!",
  () => {
    // on load event listener
    wizard.disableRightButton();
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    sleep(2000).then(() => {
      console.log("Finish Button Enabled!!!");
    });
    wizard.enableRightButton();
  },
  "",
  () => { }, // left button event listener
  "Create New Train Image",
  () => location.reload(),
  "",
  () => { } // center button event listener, do nothing
);

wizard.showWizard();

const keycloak = new Keycloak({
  realm: KC_REALM,
  url: KC_URL,
  clientId: KC_CLIENT_ID,
});

function initKeycloak() {
  keycloak
    .init({
      onLoad: "login-required",
    })
    .then(function (authenticated) {
      console.log("Authenticated: " + authenticated);
      if (authenticated) {
        wizard.setSharedDataForKey("token", keycloak.token);
        wizard.setSharedDataForKey(
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
          wizard.setSharedDataForKey("token", keycloak.token);
          wizard.setSharedDataForKey(
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

export function getCredentials() {
  return {
    token: wizard.getSharedDataForKey("token"),
    username: wizard.getSharedDataForKey("username"),
    pat: wizard.getSharedDataForKey("pat"),
  };
}

initKeycloak();

$("#logout-btn").on("click", function () {
  const trainId = wizard.getSharedDataForKey("train-id");
  apiService
    .cancelTrainCreation(trainId)
    .then(() => {
      console.log("Deleted Train");
    })
    .catch((error) => console.log(`Error deleting train: ${error.message}`));
  wizard.setSharedDataForKey("gitlab-authenticated", false);
  wizard.setSharedDataForKey("pat", null);
  wizard.setSharedDataForKey("token", null);
  wizard.setSharedDataForKey("username", null);
  keycloak.logout();
});

$("#revoke-token-btn").on("click", function () {
  apiService
    .revokeGitlabToken()
    .then((response) => {
      var response_status_code = response.status_code;
      if (response_status_code === 200) {
        console.log("User token revoked");
        wizard.setSharedDataForKey("gitlab-authenticated", false);
        wizard.setSharedDataForKey("pat", null);
        location.reload();
      } else {
        alert(response.message);
      }
    })
    .catch((error) => console.log(`Error logging off user: ${error.message}`));
});
