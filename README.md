#chefyumm

Configuration instructions:
    Node.Js : 14.X.X,
    Mysql Server :  5.X,
    AWS Elastic beanstalk,
    Android Device : version 6.0 and up

Installation instructions:
    first install npm packages using `npm install` command
    update database environment variables in .env
    check the API and database connection is working fine
    host the api on the aws elastic beanstalk or any server. example- heroku
    update API link in android application (API link is in Style.dart file)
    after that build the app and check the network permission is given. 

Operating instructions:
    First add new blogs using web panel on Api itself. example- https://API/blog/manage
    after adding blogs the blog will appear on app

Manifest
    -bin
        controllers:
            blog.js
        custom:
            error.js
            errors.js
            functions.js
        models:
            blog.js
        routes:
            blog.js
    -public:
        axios.js
        cover.css
    -uploads:
        blog:
            .gitkeep
    -views:
        index.ejs
    .env
    .gitignore
    .npmrc
    package-lock.json
    package.json
    app.js
    connection.js
    README.md

Copyright information:
    -

Contact information:
    -

Bug list:
    1.the Api is hosted on free hosting, the Api server will hardreset after some time,
    it will delete the images on the disk and the images will be unavailable.(this bug will fixed if we use storage service of AWS)
    

Troubleshooting tips: 
    just delete all the blogs by clicking the DeleteAllBlog btn on web panel and again add the blogs.

Credits and acknowledgements:


Project Logo:
    -

Project badges:
    -

Demo screenshots/gifs:
    -

Tables of contents:
    -

concise project descriptiono:
    -

clear install instructions:
    - instructions are mentioned in above instructions.

Features List:
    -backend is independant of frontend the API functionality can be easly changed in future as required.
    -Optimized Android App for most of the android device.
    -Web panel for add and delete blogs.
    -blogs images are compressed by api and converted to .webp format for fast loading of images.

Links to further reading:
    -

Changed Log:
    -Verison 1.0 (2020) initial log:
        Features:
            * Web panel added for add and delete blogs.
            * API image compression added.
            * Allowed to serve static files from the api.





    
