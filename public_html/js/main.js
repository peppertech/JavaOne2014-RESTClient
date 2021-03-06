requirejs.config({
    // Path mappings for the logical module names
    paths: {
        'knockout': 'libs/knockout/knockout-min',
        'jquery': 'libs/jquery/jquery',
        'foundation': 'libs/foundation/foundation.min',
        'response': 'libs/response/response'
    },
    // Shim configurations for modules that do not expose AMD
    shim: {
        'jquery': {
            exports: ['jQuery', '$']
        },
        'foundation': {
            deps: ['jquery']
        },
        'response': {
            deps: ['jquery']
        }
    }
});


/**
 * A top-level require call executed by the Application.
 * Although 'ojcore' and 'knockout' would be loaded in any case (they are specified as dependencies
 * by the modules themselves), we are listing them explicitly to get the references to the 'oj' and 'ko'
 * objects in the callback
 */
require(['knockout', 'jquery', 'response', 'foundation'],
        function (ko, $) // this callback gets executed when all required modules are loaded
        {

            manfucturerViewModel = function () {
                var self = this;

                Response.create({
                    breakpoints: [0, 721, 1025, 1441, 1921]
                });
                
                // The serviceHost variable is being set dynamically to allow for easier testing. 
                // you will probably want to set this to a static value once you are in production.
                // The serviceURL will vary depending on what you named your REST service
                // If you find you are getting 404 errors returned from your REST calls, this is probably the place to fix it.                
                self.serviceHost = window.location.protocol + "//" + window.location.hostname;
                self.serviceURL = self.serviceHost + ":8080/RESTFromSampleDB/webresources/com.mycompany.restfromsampledb.manufacturer";
                self.manufacturers = ko.observableArray([]);
                self.data = [];
                self.showEdit = ko.observable(false);
                self.weAreSmall = ko.observable(false);

                self.loadTable = function () {
                    self.manufacturers([]);
                    processData("GET", self.serviceURL);
                };

                Response.action(function () {
                    if (Response.band(0, 721)) {
                        self.weAreSmall(true);
                    } else {
                        self.weAreSmall(false);
                    }
                });

                self.addRow = function (ev) {
                    editVM.isAdd(true);
                    editVM.buttonName('Submit');
                    self.showEdit(true);
                };

                self.deleteRow = function (data, ev) {
                    var url = self.serviceURL + "/" + data.id();
                    processData("DELETE", url);
                };

                self.showDetails = function (data, ev) {
                    var id = data.id();
                    window.location.href = "details.html?id=" + id;
                }

            };

            function editViewModel() {
                var self = this;
                self.buttonName = ko.observable('Submit');
                self.isAdd = ko.observable();
                self.showEdit = dataVM.showEdit();
                self.url = dataVM.serviceURL;
                self.id = ko.observable();
                self.name = ko.observable();
                self.address = ko.observable();
                self.city = ko.observable();
                self.state = ko.observable();

                self.openEdit = function (data) {
                    self.buttonName('Update');
                    self.isAdd(false);
                    self.id(data.id());
                    self.name(data.name());
                    self.address(data.address());
                    self.city(data.city());
                    self.state(data.state());
                    dataVM.showEdit(true);
                };

                self.editRow = function (form) {
                    var url = self.url + "/" + self.id();
                    self.name(form[1].value);
                    self.address(form[2].value);
                    self.city(form[3].value);
                    self.state(form[4].value);
                    var jsonData = {"zip": "", "city": self.city(), "phone": "", "name": self.name(), "addressline2": "", "addressline1": self.address(), "state": self.state(), "fax": "", "rep": "", "email": "", "manufacturerId": self.id()};
                    processData("PUT", url, JSON.stringify(jsonData));
                };

                self.addRow = function (data) {
                    var id = data[0].value;
                    self.name(data[1].value);
                    self.address(data[2].value);
                    self.city(data[3].value);
                    self.state(data[4].value);
                    var jsonData = {"zip": "", "city": self.city(), "phone": "", "name": self.name(), "addressline2": "", "addressline1": self.address(), "state": self.state(), "fax": "", "rep": "", "email": "", "manufacturerId": id};
                    processData("POST", self.url, JSON.stringify(jsonData));
                };

                self.takeAction = function (form) {
                    if (self.isAdd()) {
                        self.addRow(form);
                    } else {
                        self.editRow(form);
                    }
                };

            }

            function processData(method, url, newData) {
                var self = this;
                if (!newData)
                    newData = "";
                $.ajax({
                    url: url,
                    type: method,
                    contentType: 'application/json',
                    dataType: 'json',
                    data: newData,
                    success: function (data, status, xhr) {
                        self.data = data;

                        // If we are returning a success, and there is no content, then it's probably a delete method, so just clear and reload the table.
                        if (status === "nocontent") {
                            //TODO: don't clear and reload. Just remove the record from the observableArray using Knockout utils. 
                            //Currently doing an extra unneeded REST call.
                            dataVM.manufacturers([]);
                            dataVM.loadTable();
                            dataVM.showEdit(false);
                            return true;
                        }
                        //If we get something back, update the observable that builds the table
                        if (self.data.length > 0) {
                            
                            $.each(self.data, function () {
                                dataVM.manufacturers.push({
                                    id: ko.observable(this.manufacturerId),
                                    name: ko.observable(this.name),
                                    address: ko.observable(this.addressline1),
                                    city: ko.observable(this.city),
                                    state: ko.observable(this.state)
                                });
                            });
                        }
                        dataVM.showEdit(false);
                        $('#mainContainer').show();
                    },
                    error: function (xhr, status, error) {
                        alert("Error processing data: " + status + " : " + error);
                        console.log("Error processing data: " + status + " : " + error);
                    }
                });

            }

            dataVM = new manfucturerViewModel();
            editVM = new editViewModel();

            $(document).ready(function () {

                ko.applyBindings(editVM, document.getElementById('editSection'));
                ko.applyBindings(dataVM, document.getElementById('dataSection'));
                $(document).foundation();
                dataVM.loadTable();
            });
        });

