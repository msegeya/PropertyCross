﻿define("viewModel/ApplicationViewModel", function (require) {
  var $ = require("lib/jquery");
  var ko = require("lib/knockout");
  var util = require("viewModel/util");

  function ApplicationViewModel() {
    /// <summary>
    /// The view model that manages the view model back-stack
    /// </summary>
    var that = this;

    // ----- public fields
    // data stores
    this.propertyDataSource = new(require("model/PropertyDataSource"))();
    this.favourites = ko.observableArray();
    this.recentSearches = ko.observableArray();
    this.maxRecentSearch = 5;

    // the back stack that represents the applications current state
    this.viewModelBackStack = ko.observableArray();

    // A boolean dependant observable that is true if this application
    // needs to handle the back button, and false otherwise. 
    this.backButtonRequired = ko.computed(function () {
      return this.viewModelBackStack().length > 1;
    }, this);

    // Gets the view model that is top of the back-stack.
    this.currentViewModel = ko.computed(function () {
      return this.viewModelBackStack()[this.viewModelBackStack().length - 1];
    }, this);

    // Gets the template name for the top-most view model
    this.currentView = ko.computed(function () {
      var viewModel = this.currentViewModel();
      return viewModel ? viewModel.template : "";
    }, this);

    // ----- app view models
    var searchResultsViewModel = new (require("viewModel/SearchResultsViewModel"))(this);
    var propertyViewModel = new (require("viewModel/PropertyViewModel"))(this);
    var favouritesViewModel = new (require("viewModel/FavouritesViewModel"))(this);
    var propertySearchViewModel = new (require("viewModel/PropertySearchViewModel"))(this);

    // ----- public functions

    this.navigateTo = function (viewModel) {
      /// <summary>
      /// Navigates to the given view model by placing it on the top of the back-stack.
      /// </summary>
      this.viewModelBackStack.push(viewModel);
    };

    this.navigateToHome = function () {
      /// <summary>
      /// Navigates to the home screen
      /// </summary>
      this.viewModelBackStack.push(propertySearchViewModel);
    };

    this.navigateToSearchResults = function (location, searchResults) {
      /// <summary>
      /// Navigates to the search results.
      /// </summary>
      searchResultsViewModel.initialize(location, searchResults);
      this.navigateTo(searchResultsViewModel);
    };

    this.navigateToProperty = function (property) {
      /// <summary>
      /// Navigates to the property.
      /// </summary>
      propertyViewModel.initialize(property);
      this.navigateTo(propertyViewModel);
    };

    this.navigateToFavourites = function () {
      /// <summary>
      /// Navigates to the favourites.
      /// </summary>
      this.navigateTo(favouritesViewModel);
    };

    this.back = function () {
      /// <summary>
      /// Navigates backwards.
      /// </summary>
      this.viewModelBackStack.pop();
    };

    this.setState = function (stateString) {
      /// <summary>
      /// Sets the application based on the given JSON string
      /// </summary>

      var state = $.parseJSON(stateString);
      if (!state)
        return;
      if (state.favourites) {
        $.each(state.favourites, function () {
          that.favourites.push(util.hydrateObject(that, this));
        });
      }
      if (state.recentSearches) {
        $.each(state.recentSearches, function () {
          that.recentSearches.push(util.hydrateObject(that, this));
        });
      }
    };

    this.state = ko.computed(function() {
      var state = {
        recentSearches: this.recentSearches(),
        favourites: this.favourites()
      };
      return ko.toJSON(state);
    }, this);


    this.getFavouriteByGuid = function (guid) {
      /// <summary>
      /// Gets the a favourite by GUID, returning null if it is not found
      /// </summary>

      return ko.utils.arrayFirst(this.favourites(), function (property) {
        return property.guid() === guid();
      });
    };

    this.addToFavourites = function (propertyViewModel) {
      /// <summary>
      /// Adds the given property view model to the list of favourites
      /// </summary>
      var existingFavourite = this.getFavouriteByGuid(propertyViewModel.guid);

      // add or remove
      if (!existingFavourite) {
        propertyViewModel.isFavourite(true);
        this.favourites.push(propertyViewModel);
      } else {
        propertyViewModel.isFavourite(false);
        this.favourites.remove(existingFavourite);
      }
    };

    this.addToRecentSearches = function (searchLocation) {
      /// <summary>
      /// Add to the recent search list
      /// </summary>

      // check to see whether this location already appears in the list
      var locationPresent = ko.utils.arrayFirst(this.recentSearches(), function (recentLocation) {
        return recentLocation.displayString === searchLocation.displayString;
      });
      if (locationPresent) {
        return;
      }

      // add this new item
      if (this.recentSearches().length > this.maxRecentSearch) {
        this.recentSearches.pop();
      }
      this.recentSearches.unshift(searchLocation);
    }
  }

  return ApplicationViewModel;
});