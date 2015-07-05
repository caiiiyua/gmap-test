package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/go-xorm/xorm"
	"github.com/julienschmidt/httprouter"
)

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	file, err := os.Open("public/html/index.html")
	defer file.Close()
	if err != nil {
		fmt.Fprint(w, "Error: %v\n", err)
	}
	data, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Fprint(w, "Error: %v\n", err)
	}
	fmt.Println("Get Request for Index ....")
	fmt.Fprint(w, string(data))
}

func UserGetHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

}

func UserPostHandler(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {

}

var (
	Engine *xorm.Engine
)

func sfvTask(url string) {
	res, err := http.Get(url)
	if err != nil {
		// handle error
		fmt.Println("got error:", err)
	}
	defer res.Body.Close()

	// use utfBody using goquery
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		// handler error
		fmt.Println("got error:", err)
	}
	doc.Find("div.textblock").Each(func(i int, s *goquery.Selection) {
		alt, ok := s.Find("IMG").Attr("alt")
		if !ok {
			fmt.Println(alt)
			return
		}
		fmt.Println("get from html as result:", alt)
	})
}

func sfvTaskSchedule() {
	// backupUrl := "https://www.immigration.govt.nz/secure/Login+Silver+Fern.htm"
	url := "http://www.immigration.govt.nz/migrant/stream/work/silverfern/jobsearch.htm"
	for {
		sfvTask(url)
		time.Sleep(120 * 1e9)
		fmt.Println("Next task will be started 120s later...")
	}
}

func main() {
	router := httprouter.New()
	router.ServeFiles("/html/*filepath", http.Dir("public/html"))
	router.ServeFiles("/js/*filepath", http.Dir("public/js"))
	router.ServeFiles("/css/*filepath", http.Dir("public/css"))
	router.ServeFiles("/bower/*filepath", http.Dir("public/bower_components"))
	router.GET("/", Index)
	router.GET("/user", UserGetHandler)
	router.POST("/user", UserPostHandler)

	// go sfvTaskSchedule()

	// var err error
	// Engine, err = xorm.NewEngine("mysql", "test:1234@/sfver?charset=utf8")
	// if err != nil {
	// 	log.Fatal("database err:", err)
	// }
	// Engine.ShowDebug = true
	// Engine.ShowErr = true
	// Engine.ShowWarn = true
	// Engine.ShowSQL = true
	// f, err := os.Create("sql.log")
	// if err != nil {
	// 	log.Fatal("sql log create failed", err)
	// }
	// defer f.Close()
	// Engine.Logger = xorm.NewSimpleLogger(f)

	// err = Engine.Sync2(new(sfv.Sfver))
	// if err != nil {
	// 	log.Fatal("database sync failed", err)
	// }

	// http.Handle("/", http.FileServer(http.Dir("public/")))

	fmt.Println("Listending at 8080 ...")
	log.Fatal(http.ListenAndServe(":8080", router))
}
