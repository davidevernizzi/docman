'use strict';

var React = require('react');
var Underscore= require('underscore');

var Button = require('react-bootstrap').Button;
var Input = require('react-bootstrap').Input;
var Row = require('react-bootstrap').Row;
var Label = require('react-bootstrap').Label;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;
var PageHeader = require('react-bootstrap').PageHeader;
var Panel = require('react-bootstrap').Panel;
var PanelGroup = require('react-bootstrap').PanelGroup;
var JSZip = require("jszip");

var toSave="";
var ApiBar = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var api = JSON.parse($(e.currentTarget).parents('form').find("[name=api]").val());
        this.props.updateState(api);
        $('#apiBar').hide();
    },
    handleSubmitSave: function(e) {
        e.preventDefault();
        var api = JSON.parse($(e.currentTarget).parents('form').find("[name=api]").val());
        this.props.updateState(api);
        $('#apiBar').hide();
        /**
         * Zip the html ,css and js
         * @type {JSZip}
         */
        var zip = new JSZip();
        var docmanFiles = zip.folder("docman");
        var head = React.renderToString(<DocBarHead state={api}/> );
        var toSave=React.renderToString(<DocBar state={api} />);
        docmanFiles.file("docman.html", head+toSave);
        var src = docmanFiles.folder("css");
        $.get("css/style.css", function(data){
            src.file("style.css", data);
            var content = zip.generate({type:"blob"});
            saveAs(content, "docman.zip");
        })
    },
    render: function() {
        return (
            <div>
                <h3>Paste below your postman collection</h3>
                <form >
                    <Row className="actionButtons">
                            <Input onClick={this.handleSubmit} className="btn btn-primary"  type="button" name="preview" value="View docs" wrapperClassName='col-xs-6' />
                            <Input onClick={this.handleSubmitSave} className="btn btn-success" type="button" name="download" value="Download docs" wrapperClassName='col-xs-6' />
                    </Row>
                    <Row>
                        <Input type='textarea' name='api' rows='20' labelClassName='col-xs-1' wrapperClassName='col-xs-12' />
                    </Row>
                </form>
            </div>
        );
    }
});
var DocBarHead = React.createClass({
    render: function() {
        var innerHtmlHead=$("head").html();
        return (
            <head dangerouslySetInnerHTML={{__html: innerHtmlHead}}></head>
        );
    }
});
var RequestDetails = React.createClass({
    render: function() {
        return (
            <div className='col-xs-12 details'>
                <Label className='col-xs-1 apiDetailType' bsStyle='default'>{this.props.type}</Label>
                <div className='col-xs-10 apiDetailValue'><code>{this.props.value}</code></div>
            </div>
        );
    }
});

var RequestData = React.createClass({
    render: function() {
        var request = this.props.request;

        switch (request.dataMode) {
            case 'raw':
                return <RequestDetails type='Raw data' value={request.rawModeData} />;
                break;
            case 'params':
              if (request.data && request.data.length>0) {
                    var data = request.data.map(function(param, index) {
                        if (index > 0) {
                            return (
                                <div className='col-xs-offset-1 col-xs-10 apiDetailValue'>
                                    <code>{param.key}</code> = <code>{param.value}</code> ({param.type})
                                </div>
                            );
                        }
                        else {
                            return (
                                <div className='col-xs-10 apiDetailValue'>
                                    <code>{param.key}</code> = <code>{param.value}</code> ({param.type})
                                </div>
                            );
                        }
                    });
                    return (
                        <div className='col-xs-12 details'>
                            <Label className='col-xs-1 apiDetailType' bsStyle='default'>Form data</Label>
                            {data}
                        </div>
                    );
                }
                break;
            default:
                break;
        }

        return <span />;
    }
});

var RequestHeaders = React.createClass({
    render: function() {
        if (this.props.request.headers != "") {
            return (
                <RequestDetails type='Headers' value={this.props.request.headers} />
            );
        }

        return <span />;
    }
});

var RequestCurlUsage = React.createClass({
    render: function() {
        var request = this.props.request;
        var headers = request.headers.split('\n');
        var headersString = '';
        var i = 0;

        for (i=0; i<headers.length; i++) {
            if (headers[i] !== '') {
                headersString += '-H "' + headers[i] + '" ';
            }
        }
        switch (request.dataMode) {
            case 'raw':
                var curlCommand = <code>curl -X {request.method} -H {headersString} -d '{request.rawModeData}' '{request.url}';</code>;
                return (
                    <RequestDetails type='Curl' value={curlCommand} />
                );
                break;
            case 'params':
                if (request.data){
                    var data = request.data.map(function(param, index) {
                        var key = param.key.trim();
                        var value = param.value.trim();
                        return key + '="' + value + '"';
                    });
                    var dataStr = data.join('&');
                    var curlCommand = <code>curl -X {request.method} {headersString} -d '{dataStr}' '{request.url}';</code>;
                    return (
                        <RequestDetails type='Curl' value={curlCommand} />
                    );
                    break;
                }else{
                    var curlCommand = <code>curl -X {request.method} -H {headersString}  '{request.url}';</code>;
                    return (
                        <RequestDetails type='Curl' value={curlCommand} />
                    );
                }
            default:
                return <div><code>curl {request.dataMode}</code></div>;

        }
    }
});

var Request = React.createClass({
    render: function() {
        var request = this.props.request;
        var methodClass = 'default';
        var requestHeader = '';
        var requestData = '';

        var methodClasses="col-xs-1 apiMethod ";
        switch (request.method) {
            case 'GET':
                methodClass = 'label-get';
                break;
            case 'POST':
                methodClass = 'label-post';
                break;
            case 'PUT':
                methodClass = 'label-put';
                break;
            case 'DELETE':
                methodClass = 'label-delete';
                break;
            case 'PATCH':
                methodClass = 'label-patch';
                break;
            case 'HEAD':
                methodClass = 'label-head';
                break;
            case 'OPTIONS':
                methodClass = 'label-options';
                break;
            default:
                methodClass = 'default';
                break;
        }
        methodClasses=methodClasses+" "+methodClass;
        return (
            <div className='row apiElement'>
                <h3 className='col-xs-8 apiName'>{request.name}</h3>
                <h4>
                    <div className='col-xs-12'>
                        <Label className={methodClasses} >{request.method}</Label>
                        <div className='col-xs-10 apiUrl'>
                            <code className='col-xs-12'>{request.url}</code>
                            <div className='col-xs-12'>{request.description}</div>
                        </div>
                    </div>
                </h4>
                <hr className='col-xs-8'/>
                <RequestHeaders request={request}/>
                <RequestData request={request}/>
                <RequestCurlUsage request={request}/>
            </div>
            );
    }
});
var DocBar = React.createClass({
    render: function() {
        var toRender=null;
        var api = this.props.state;
        var requestGroupItems=null;

        var requestGroups=Underscore.groupBy(api.requests, function(request){
            return request.folder;
        });

        var requestGroupsToRender = Underscore.map(requestGroups,function(requestGroup) {
            requestGroupItems = Underscore.map(requestGroup,function(requestGroupItem){
                return (<ListGroupItem><Request request={requestGroupItem} /></ListGroupItem>);
            });
            var folderIndex=Underscore.findIndex(api.folders, function(folder){
                return folder.id===Underscore.first(requestGroup).folder;
            });
            var folderName= (folderIndex!==-1)? api.folders[folderIndex].name: requestGroup.folder;
            var folderLink="#"+folderName;
            return (<Panel collapsible defaultExpanded header={folderName}> <ListGroup href={folderLink} >
                {requestGroupItems}
            </ListGroup></Panel>);
        });

        toRender=(
          <div>
              <PanelGroup>
                  <h1 className='apiTitle'>{api.name}</h1>
                  {requestGroupsToRender}
              </PanelGroup>
          </div>
        );


        return toRender;
    }

});

var Faq = React.createClass({
    render: function() {
        return (
            <div className='col-xs-12'>
                <div><strong>{this.props.question}</strong></div>
                <div dangerouslySetInnerHTML={{__html: this.props.answer}} />
            </div>
            );
    }
});

var Doc = React.createClass({
    getInitialState: function() {
        return {
            api: {
            name: '',
            requests: []
            }
        };
    },
    updateState: function(json) {
        var newState = {api: json};
        this.setState(newState);
    },

    render: function() {
        return (
            <div className="docman">
                <PageHeader>Docman <small>documentation for Postman</small></PageHeader>
                <div id='apiBar' className='apiBar'>
                    <ApiBar updateState={this.updateState} />
                    <h3 className='col-xs-12'>FAQ</h3>
                    <Faq question='What is docman?' answer='docman is a simple tool to create clean documentation from postman collections' />
                    <Faq question='What is postman?' answer='postman is an awsome tool to build and test your API. Check out more <a href="https://www.getpostman.com/">here</a>' />
                    <Faq question='Why another tool to document APIs?' answer='While there are many great tools I could not find anyone that works with postma. And postman is so awesome I really want to use it :-)' />
                    <Faq question='Uhm, what if I want to try docman, but I do not use postman (yet)' answer='Try a <a href="https://www.getpostman.com/collections/979952cbb87f94b26336">demo collection</a>' />
                    <Faq question='Okay, it looks promising, but there is still a lot to do. And something does not work' answer='Fork me on <a href="https://github.com/davidevernizzi/docman">github</a> or submit <a href="https://github.com/davidevernizzi/docman/issues">issues</a> :-)' />
                </div>
                <div className='docBar'>
                    <DocBar state={this.state.api} />
                </div>
                <div className='col-xs-12 footer'>
                    <div>Made with ♥ by <a href='http://www.vernizzis.it'>dave</a></div>
                </div>
            </div>
        );
    }
});

module.exports = Doc;
