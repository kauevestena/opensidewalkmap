import folium
import pandas as pd
import geopandas as gpd
from functions import *

m = folium.Map(
    # min_zoom=2,
    # # crs="EPSG4326"
    # max_zoom=10,
    tiles=None
)

folium.TileLayer(tiles='Stamen Toner',opacity=0.4,min_zoom=2,max_zoom=10).add_to(m)


cities_df = pd.read_csv('cities_data.csv')


### columns are: 
# # #   city_name,center_long,center_lat,url

for city_row in cities_df.itertuples():
    # print(city_row.url)


    print(city_row.center_lat,city_row.center_long)
    folium.Marker(location=[city_row.center_lat,city_row.center_long],popup=a_href_str(city_row.city_name,city_row.url)).add_to(m)




m.save('index.html')