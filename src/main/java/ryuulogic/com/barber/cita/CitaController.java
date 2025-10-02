package ryuulogic.com.barber.cita;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/cita")
public class CitaController {
    @Autowired
    CitaRepository citaRepository;
    @GetMapping()
    public ResponseEntity<Iterable<Cita>> findAll() {return ResponseEntity.ok(citaRepository.findAll());}

    @GetMapping("/{id_cita}")
    public ResponseEntity<Cita> findById(@PathVariable Long id_cita) {
        Optional<Cita> indicadorResultadoOptional = citaRepository.findById(id_cita);
        if (indicadorResultadoOptional.isPresent()) {return ResponseEntity.ok(indicadorResultadoOptional.get());}
        else {return ResponseEntity.notFound().build();}
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody Cita newCita, UriComponentsBuilder ucb) {
        Cita savedCita = citaRepository.save(newCita);
        URI uri =ucb
                .path("Cita/{id_cita}")
                .buildAndExpand(savedCita.getClass())
                .toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping("/{id_cita}")
    public ResponseEntity<Void> update(@PathVariable Long id_cita, @RequestBody Cita citaAct) {
        Cita citaAnt = citaRepository.findById(id_cita).get();
        if (citaAnt != null) {
            citaAct.setId_cita(citaAnt.getId_cita());
            citaRepository.save(citaAct);
            return ResponseEntity.noContent().build();
        }
        else{return ResponseEntity.notFound().build();}
    }

    @DeleteMapping("/{id_cita}")
    public ResponseEntity<Void> delete(@PathVariable Long id_cita) {
        if (citaRepository.findById(id_cita).get() != null) {
            citaRepository.deleteById(id_cita);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
