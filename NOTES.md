Debug
====

To prevent users being logged out when the application is restarted, EHCACHE is configured to 
cache to disk. This must be disabled for the production server 
(see conf/ehcache.xml/defaultCache/diskPersistent).

Useful Commands
===

Drops the databse:

* mongo biobank-web --eval "db.dropDatabase()"