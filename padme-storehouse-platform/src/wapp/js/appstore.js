class Appstore {
  constructor() {
    this.pageViews = [];
    this.pageViewContents = [];
    this.data = {};
    this.currentPageIndex = -1;
    this.previousPageIndex = -1;
    this.storePageChangesInMemory = false;
  }

  setUsePreviousPageFromMemory = (useFromMemory) => {
    this.storePageChangesInMemory = useFromMemory;
  };

  setSharedDataForKey = (key, value) => {
    this.data[key] = value;
  };

  getSharedDataForKey = (key) => this.data[key];

  getAppstoreSharedData = () => this.data;

  setupPage = (loadPageAgain) => {
    const appstoreContent = $("#appstore-content")[0];
    $(appstoreContent).animate(
      {
        opacity: 0,
      },
      400,
      () => {
        $(appstoreContent)
          .html(this.pageViewContents[this.currentPageIndex])
          .animate(
            {
              opacity: 1,
            },
            400
          );

        const appstoreTitle = $("#appstore-title")[0];
        $(appstoreTitle).text(this.pageViews[this.currentPageIndex].title);

        const leftButton = $("#appstore-nav-left-btn")[0];
        $(leftButton).text(this.pageViews[this.currentPageIndex].leftBtnText);
        $(leftButton).off("mousedown");
        $(leftButton).on(
          "mousedown",
          this.pageViews[this.currentPageIndex].leftBtnListener
        );

        const rightButton = $("#appstore-nav-right-btn")[0];
        $(rightButton).text(this.pageViews[this.currentPageIndex].rightBtnText);
        $(rightButton).off("mousedown");
        $(rightButton).on(
          "mousedown",
          this.pageViews[this.currentPageIndex].rightBtnListener
        );

        const centerButton = $("#appstore-nav-center-btn")[0];
        $(centerButton).text(
          this.pageViews[this.currentPageIndex].centerBtnText
        );
        $(centerButton).off("mousedown");
        $(centerButton).on(
          "mousedown",
          this.pageViews[this.currentPageIndex].centerBtnListener
        );

        // TODO: Check if this works
        if (loadPageAgain) {
          this.pageViews[this.currentPageIndex].onLoadListener &&
            this.pageViews[this.currentPageIndex].onLoadListener();
        }
      }
    );
  };

  addPage = (
    title,
    onLoadListener,
    leftBtnText,
    leftBtnListener,
    rightBtnText,
    rightBtnListener,
    centerBtnText,
    centerBtnListener
  ) => {
    onLoadListener && (onLoadListener = onLoadListener.bind(this));
    leftBtnListener && (leftBtnListener = leftBtnListener.bind(this));
    rightBtnListener && (rightBtnListener = rightBtnListener.bind(this));
    centerBtnListener && (centerBtnListener = centerBtnListener.bind(this));
    this.pageViews.push({
      title: title,
      onLoadListener: onLoadListener,
      leftBtnText: leftBtnText,
      leftBtnListener: leftBtnListener,
      rightBtnText: rightBtnText,
      rightBtnListener: rightBtnListener,
      centerBtnText: centerBtnText,
      centerBtnListener: centerBtnListener,
    });
  };

  showAppstore = () => {
    // show a loading gif until the appstore partial views are loaded
    $("#appstore-content").html(
      '<div class="appstore__page"><img src="images/loading.gif" /></div>'
    );

    const partialViews = [
      "appstore-authentication.html",
      "appstore-select-train-store.html",
      "appstore-show-all-branches.html",
      "appstore-show-all-train-images.html",
      "appstore-show-train-content.html",
      "appstore-show-train-image-summary.html",
      "appstore-save-user-feedback.html",
      "appstore-create-git-merge-request.html",
      "appstore-show-git-merge-request.html",
      "appstore-final-step.html",
    ];
    const promises = [];
    for (let i = 0; i < partialViews.length; i++) {
      promises.push($.get("views/" + partialViews[i]));
    }

    Promise.all(promises).then((contents) => {
      this.pageViewContents = $("<div/>")
        .append(contents)
        .find(".appstore__page");
      this.currentPageIndex = 0;
      this.setupPage(true);
    });
  };

  viewNextPage = (pageNumber, loadPageListener = true) => {
    if (this.storePageChangesInMemory) {
      const content = $("#appstore .appstore__page")[0];
      this.pageViewContents[this.currentPageIndex] = content;
    }
    this.previousPageIndex = this.currentPageIndex;
    typeof pageNumber == "number"
      ? (this.currentPageIndex = pageNumber - 1)
      : this.currentPageIndex++;
    this.setupPage(loadPageListener);
  };

  viewPreviousPage = (pageNumber, loadPageListener = true) => {
    this.previousPageIndex = this.currentPageIndex;
    typeof pageNumber == "number"
      ? (this.currentPageIndex = pageNumber - 1)
      : this.currentPageIndex--;
    this.setupPage(loadPageListener);
  };

  getCurrentPageNumber = () => this.currentPageIndex + 1;

  disableLeftButton = () => {
    const leftButton = $("#appstore-nav-left-btn")[0];
    $(leftButton).prop("disabled", true);
    $(leftButton).addClass("appstore__nav__btn-disabled");
  };

  enableLeftButton = () => {
    const leftButton = $("#appstore-nav-left-btn")[0];
    $(leftButton).prop("disabled", false);
    $(leftButton).removeClass("appstore__nav__btn-disabled");
  };

  disableRightButton = () => {
    const rightButton = $("#appstore-nav-right-btn")[0];
    $(rightButton).prop("disabled", true);
    $(rightButton).addClass("appstore__nav__btn-disabled");
  };

  enableRightButton = () => {
    const rightButton = $("#appstore-nav-right-btn")[0];
    $(rightButton).prop("disabled", false);
    $(rightButton).removeClass("appstore__nav__btn-disabled");
  };

  disableCenterButton = () => {
    const centerButton = $("#appstore-nav-center-btn")[0];
    $(centerButton).prop("disabled", true);
    $(centerButton).addClass("appstore__nav__btn-disabled");
  };

  enableCenterButton = () => {
    const centerButton = $("#appstore-nav-center-btn")[0];
    $(centerButton).prop("disabled", false);
    $(centerButton).removeClass("appstore__nav__btn-disabled");
  };
}

export default Appstore;
